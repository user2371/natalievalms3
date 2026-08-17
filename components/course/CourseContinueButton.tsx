"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { useProgress } from "@/lib/progress/useProgress";
import type { Lesson } from "@/modules/lessons";

export interface CourseContinueButtonProps {
  courseId: string;
  courseSlug: string;
  lessons: Lesson[];
  className?: string;
}

/**
 * CTA-кнопка на лендінгу реального курсу (`/courses/[slug]`, задача 5.12) —
 * визначає "наступний рекомендований урок" гостя (перший НЕПРОЙДЕНИЙ за
 * `order`) і веде саме на нього. Якщо прогресу ще немає — це перший урок
 * курсу; якщо всі уроки пройдені — знову перший (просто "Переглянути
 * курс" замість "Продовжити", нема сенсу зупинятись).
 *
 * **Без жодного обмеження доступу до інших уроків** (той самий принцип
 * "уроки не блокуються", що й усюди в проєкті) — це лише навігаційна
 * підказка, куди клікнути, а не єдиний дозволений шлях: інші уроки
 * лишаються доступними напряму через `CourseLessonSidebar`.
 *
 * Клієнтський компонент (не сам `/courses/[slug]/page.tsx`, Server
 * Component) — `useProgress` читає `localStorage`/БД, недоступні на сервері.
 * **Fixes/F.11:** для залогінених тепер читає реальний прогрес із БД (не
 * лише гостьовий `localStorage`) — деталі в `lib/progress/useProgress.ts`.
 */
export function CourseContinueButton({
  courseId,
  courseSlug,
  lessons,
  className,
}: CourseContinueButtonProps) {
  const { progress, hydrated } = useProgress(courseId);

  if (lessons.length === 0) {
    return null;
  }

  const nextLesson =
    lessons.find((lesson) => !progress[lesson.id]?.completed) ?? lessons[0];
  const allCompleted =
    hydrated && lessons.every((lesson) => progress[lesson.id]?.completed);
  const hasAnyProgress =
    hydrated && lessons.some((lesson) => progress[lesson.id]?.completed);

  const label = allCompleted
    ? "Переглянути курс знову"
    : hasAnyProgress
      ? "Продовжити навчання"
      : "Почати навчання";

  return (
    <Link href={`/courses/${courseSlug}/lessons/${nextLesson.id}`} className={className}>
      <span className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-dark">
        {label}
        <ArrowRightIcon size={17} />
      </span>
    </Link>
  );
}
