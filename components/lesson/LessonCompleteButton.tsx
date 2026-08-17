"use client";

import { CheckIcon } from "@/components/ui/icons";
import { Button } from "@/components/ui/Button";
import { useProgress } from "@/lib/progress/useProgress";

export interface LessonCompleteButtonProps {
  courseId: string;
  lessonId: string;
  className?: string;
}

/**
 * Кнопка "Позначити урок пройденим" (задача 5.10) для реальних (Prisma)
 * уроків — `/courses/[slug]/lessons/[lessonId]`.
 *
 * **Правило станом на задачу 5.10 (актуально, коли `modules/quizzes` ще не
 * існував, Фаза 6): лише РУЧНЕ позначення, не автоматичне** — навмисно, той
 * самий принцип, що й 4.5: без реального критерію завершення авто-
 * позначення було б довільним.
 *
 * **Fixes/F.10 (points fix, 04.08.2026): звужено до уроків БЕЗ квізу.**
 * Відколи в уроків з'явився квіз (Фаза 6) і бали нараховуються АВТОМАТИЧНО
 * лише через його проходження (`RealQuizBlock`/`submitQuizResultAction`),
 * ручне позначення для таких уроків дозволяло обійти квіз і при цьому не
 * отримати бали (сам компонент про бали нічого не знає — просто пише
 * `Progress.completed`). Батьківська сторінка тепер рендерить цю кнопку
 * ЛИШЕ коли `quizQuestions` немає (`!quizQuestions` —
 * `app/courses/[slug]/lessons/[lessonId]/page.tsx`); для уроків із квізом
 * єдиний спосіб завершити урок — сам квіз. Сам компонент лишається
 * незмінним (умова — на рівні виклику, не тут), бали за цей шлях
 * нараховуються в `modules/progress/service.ts` (`syncLocalProgressService`).
 */
export function LessonCompleteButton({
  courseId,
  lessonId,
  className,
}: LessonCompleteButtonProps) {
  const { progress, hydrated, markLessonCompleted } = useProgress(courseId);
  const isCompleted = progress[lessonId]?.completed ?? false;

  if (isCompleted) {
    return (
      <div
        className={className}
        // Задача 5.10: після позначення кнопка стає статичним індикатором
        // — повторний клік нічого не змінив би (позначення незворотне,
        // немає сценарію "розпозначити").
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2 text-sm font-medium text-accent-dark">
          <CheckIcon size={16} />
          Урок пройдено
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={() => markLessonCompleted(lessonId)}
      // До гідратації (перший рендер) стан ще невідомий — не даємо
      // клікнути, щоб не показати "успіх" до реального запису.
      disabled={!hydrated}
      className={className}
    >
      Позначити урок пройденим
    </Button>
  );
}
