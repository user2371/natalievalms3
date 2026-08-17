"use client";

import { useSession } from "next-auth/react";
import { QuizBlock } from "@/components/lesson/QuizBlock";
import { useProgress } from "@/lib/progress/useProgress";
import { submitQuizResultAction } from "@/modules/quizzes";
import type { QuizQuestion } from "@/lib/data/lessons";

export interface RealQuizBlockProps {
  courseId: string;
  lessonId: string;
  questions: QuizQuestion[];
  className?: string;
}

/**
 * Обгортка над `QuizBlock` (перевикористаний без змін, крім розширення
 * `onComplete`, задача 6.17) — для реальних (Prisma) уроків. Вирішує, ДЕ
 * зберегти результат проходження.
 *
 * **Задача 6.17 — правило збереження:**
 * - Гість (`useProgress`, `localStorage`, Фаза 5) — ЗАВЖДИ записується,
 *   незалежно від статусу сесії. Причина: `useProgress`/`CourseLessonSidebar`/
 *   `LessonCompleteButton` наразі й так завжди читають прогрес з
 *   `localStorage` (задокументовано в `useProgress.ts` — `modules/progress`,
 *   реальне серверне ЧИТАННЯ для залогінених, ще не існує, Фаза 7). Якби
 *   тут писати результат ЛИШЕ в БД для залогіненого, сайдбар/кнопка
 *   "пройдено" не побачили б цей прогрес одразу — зламана консистентність
 *   UI. Тому запис у `localStorage` — завжди, як спільне джерело правди
 *   для UI цієї сторінки, поки Фаза 7 не переведе читання на сесію.
 * - Залогінений — ДОДАТКОВО (поверх localStorage) пишеться в `Progress`
 *   через `submitQuizResultAction` (`modules/quizzes`, задача 6.7) —
 *   best-effort, не блокує й не ламає UI, якщо запит не вдався (наприклад,
 *   мережева помилка) — локальний прогрес усе одно зберігся.
 *
 * **Задача 6.18 — "урок вважається пройденим після проходження квізу":
 * без порогу (будь-який результат)**, узгоджено з уже наявною поведінкою
 * легасі-флоу (`/lessons/[slug]`: `onComplete={() => markComplete(lesson.slug)}`
 * викликається незалежно від кількості правильних відповідей). `setQuizResult`
 * (`localProgress.ts`) і так завжди виставляє `completed: true` — жодної
 * додаткової умови не знадобилось.
 */
export function RealQuizBlock({
  courseId,
  lessonId,
  questions,
  className,
}: RealQuizBlockProps) {
  const { status } = useSession();
  const { markQuizResult } = useProgress(courseId);

  function handleComplete({
    correctCount,
    total,
  }: {
    correctCount: number;
    total: number;
  }) {
    markQuizResult(lessonId, correctCount, total);

    if (status === "authenticated") {
      submitQuizResultAction(lessonId, correctCount, total).catch(() => {
        // best-effort: локальний прогрес уже збережено вище, мовчки ігноруємо.
      });
    }
  }

  return (
    <QuizBlock questions={questions} onComplete={handleComplete} className={className} />
  );
}
