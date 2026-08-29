"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface LessonSpoilerProps {
  /** Заголовок, який видно завжди — і в згорнутому, і в розгорнутому стані. */
  title: ReactNode;
  /** Вміст блоку (ДЗ / стаття / квіз) — рендериться лише коли розгорнуто. */
  children: ReactNode;
  /** Розгорнутий стан за замовчуванням. За замовчуванням — згорнуто. */
  defaultOpen?: boolean;
  className?: string;
}

/**
 * Обгортка-спойлер для секцій на сторінці уроку (ДЗ, стаття, квіз) — за
 * запитом ховає ці блоки під клікабельний заголовок замість того, щоб
 * показувати їх одразу розгорнутими.
 */
export function LessonSpoiler({
  title,
  children,
  defaultOpen = false,
  className,
}: LessonSpoilerProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-rose-line/40 bg-white shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left sm:px-8"
      >
        <span className="font-serif text-xl text-ink">{title}</span>
        <ChevronDownIcon
          size={18}
          className={cn(
            "shrink-0 text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && <div className="px-0 pb-0">{children}</div>}
    </div>
  );
}
