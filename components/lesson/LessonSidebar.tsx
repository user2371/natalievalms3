"use client";

import { useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LessonSidebarItem } from "@/components/lesson/LessonSidebarItem";
import { ChevronDownIcon, DiplomaIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { LESSONS } from "@/lib/data/lessons";

export interface LessonSidebarProps {
  /** Slug активного (поточного) уроку. */
  activeSlug: string;
  /** Slugs пройдених уроків. Ніколи не обмежує доступ до інших уроків. */
  completedSlugs: Set<string>;
  className?: string;
}

export function LessonSidebar({
  activeSlug,
  completedSlugs,
  className,
}: LessonSidebarProps) {
  // Адаптив (задача 0.7.25): на мобільному сайдбар — акордеон, згорнутий за
  // замовчуванням (кнопка перемикання видима лише нижче breakpoint `lg`).
  // На десктопі список і без того завжди розгорнутий (`lg:block`) — стан
  // `open` там ігнорується.
  const [open, setOpen] = useState(false);
  const progressPercent =
    LESSONS.length > 0 ? Math.round((completedSlugs.size / LESSONS.length) * 100) : 0;

  return (
    <aside
      className={`rounded-2xl border border-rose-line/40 bg-white shadow-sm ${className ?? ""}`}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 border-b border-rose-line/30 p-4 text-left lg:pointer-events-none"
      >
        <span className="flex-1">
          <h2 className="font-serif text-lg text-ink">Програма курсу</h2>

          <span className="mt-3 block">
            <span className="flex items-center justify-between text-xs text-muted">
              <span>Ваш прогрес</span>
              <span className="font-medium text-accent-dark">{progressPercent}%</span>
            </span>
            <ProgressBar value={progressPercent} size="sm" className="mt-1.5" />
          </span>
        </span>

        <ChevronDownIcon
          size={18}
          className={cn(
            "shrink-0 text-muted transition-transform lg:hidden",
            open && "rotate-180",
          )}
        />
      </button>

      <div className={cn(open ? "block" : "hidden", "lg:block")}>
        <nav className="flex flex-col gap-0.5 p-2" aria-label="Список уроків курсу">
          {LESSONS.map((lesson) => {
            const isCurrent = lesson.slug === activeSlug;
            const isCompleted = completedSlugs.has(lesson.slug);

            return (
              <LessonSidebarItem
                key={lesson.slug}
                lesson={lesson}
                status={isCurrent ? "current" : isCompleted ? "completed" : "incomplete"}
              />
            );
          })}
        </nav>

        <div className="m-3 mt-1 flex items-start gap-3 rounded-xl bg-accent-soft/40 p-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent-dark">
            <DiplomaIcon size={18} />
          </span>
          <p className="text-xs leading-snug text-ink">
            <span className="font-medium">Отримай сертифікат</span> після завершення курсу
          </p>
        </div>
      </div>
    </aside>
  );
}
