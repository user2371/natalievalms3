"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";
import type { Lesson } from "@/lib/data/lessons";

export interface LessonContentHeaderProps {
  lesson: Lesson;
  className?: string;
}

export function LessonContentHeader({ lesson, className }: LessonContentHeaderProps) {
  return (
    <div className={className}>
      <Link
        href="/lessons"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent-dark"
      >
        <ArrowLeftIcon size={16} />
        Повернутися до програми
      </Link>

      <div className="mt-4">
        <span className="text-xs font-medium tracking-wide text-accent-dark uppercase">
          Урок {lesson.number}
        </span>
        <h1 className="mt-1 font-serif text-2xl text-ink sm:text-3xl">{lesson.title}</h1>
      </div>
    </div>
  );
}
