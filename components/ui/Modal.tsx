"use client";

import { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  /**
   * 'card' — центрована картка (default). 'sheet' — на мобільному на весь
   * екран, на sm+ звична картка. 'media' — ширша (max-w-3xl) картка з
   * меншими відступами, для перегляду великих зображень (лайтбокс, CERT+.2.7).
   */
  variant?: "card" | "sheet" | "media";
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  children,
  className,
  labelledBy,
  variant = "card",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key === "Tab" && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus();
    };
    // ВАЖЛИВО (баг-фікс F.19): ефект має ре-запускатись лише при
    // відкритті/закритті модалки (`open`), а НЕ при кожній зміні
    // посилання на `onClose`. Раніше `onClose` був у масиві залежностей,
    // а `onClose`, який передають виклики (напр. `closeEmailModal` у
    // `app/settings/page.tsx`), — це звичайна функція, що пересоздається
    // на КОЖЕН рендер батьківського компонента. Будь-яке введення тексту
    // в контрольоване поле всередині модалки (`onChange` → `setState`)
    // викликало ре-рендер батька → нове посилання `onClose` → цей ефект
    // спрацьовував заново → `dialog?.querySelector(...).focus()`
    // примусово переводив фокус на ПЕРШЕ фокусабельне поле модалки після
    // КОЖНОЇ введеної літери, незалежно від того, в яке поле насправді
    // друкував користувач. Актуальний `onClose` для обробника Escape
    // тепер читається з `onCloseRef` (оновлюється в окремому ефекті
    // вище), тож поведінка Escape не змінилась.
  }, [open]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        variant === "sheet" ? "p-0 sm:p-4" : "p-4",
      )}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "relative z-10 bg-white shadow-xl overflow-y-auto",
          variant === "sheet"
            ? "h-full w-full rounded-none sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-md sm:rounded-2xl"
            : variant === "media"
              ? "w-full max-w-3xl rounded-2xl max-h-[90vh]"
              : "w-full max-w-md rounded-2xl max-h-[90vh]",
          variant === "media" ? "p-3" : "p-6",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
