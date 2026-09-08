"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DropdownContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("Dropdown.Trigger/Content must be used within Dropdown");
  return ctx;
}

export interface DropdownProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dropdown({
  children,
  open: controlledOpen,
  onOpenChange,
}: DropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (value: boolean) => {
    setUncontrolledOpen(value);
    onOpenChange?.(value);
  };

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={rootRef} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownTrigger({ children }: { children: ReactNode }) {
  const { open, setOpen } = useDropdownContext();
  return (
    <div onClick={() => setOpen(!open)} aria-expanded={open}>
      {children}
    </div>
  );
}

export interface DropdownContentProps {
  children: ReactNode;
  align?: "left" | "right";
  /**
   * MSG+.7.8-фікс (07.09.2026) — куди розкривається панель відносно
   * тригера. За замовчуванням `"bottom"` (як і раніше, увесь наявний
   * код на це покладається). `"top"` потрібен для `EmojiPickerDropdown`
   * у `ChatPanel.tsx`: кнопка емодзі стоїть у футері форми, самому низу
   * картки чату (`overflow-hidden rounded-3xl` у
   * `MessagesSplitView.tsx`, щоб не вилазило за заокруглені кути) —
   * панель, що розкривається ВНИЗ, там просто не мала б місця й
   * обрізалась би цим `overflow-hidden`, лишаючись фактично невидимою.
   */
  side?: "top" | "bottom";
  className?: string;
}

export function DropdownContent({
  children,
  align = "right",
  side = "bottom",
  className,
}: DropdownContentProps) {
  const { open } = useDropdownContext();
  if (!open) return null;

  return (
    <div
      role="menu"
      className={cn(
        "absolute z-20 min-w-[220px] rounded-2xl border border-rose-line/40 bg-white p-2 shadow-xl",
        side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
