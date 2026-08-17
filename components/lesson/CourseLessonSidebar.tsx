"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PlayIcon, ClockIcon, ChevronDownIcon, CheckIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { useProgress } from "@/lib/progress/useProgress";
import { extractYoutubeId } from "@/lib/youtube";
import { youtubeThumbnail } from "@/lib/data/lessons";
import type { Lesson } from "@/modules/lessons";

export interface CourseLessonSidebarProps {
  /** ID курсу — для читання гостьового прогресу через `useProgress` (задачі 5.8/5.9). */
  courseId: string;
  /** slug курсу — для формування посилань на інші уроки. */
  courseSlug: string;
  /** Усі уроки курсу, відсортовані за `order` (як повертає `listLessonsService`). */
  lessons: Lesson[];
  /** ID активного (поточного) уроку. */
  activeLessonId: string;
  className?: string;
}

/**
 * Сайдбар зі списком РЕАЛЬНИХ (Prisma) уроків курсу (задача 3.13) — для
 * нових сторінок `/courses/[slug]/lessons/[lessonId]` (задача 3.15).
 * Паралельний, окремий від `components/lesson/LessonSidebar.tsx`, який і
 * далі обслуговує існуючий статичний `/lessons/[slug]` без жодних змін —
 * форма реального `Lesson` (`id`/`order`, без `slug`) відрізняється
 * достатньо, щоб не форсувати одну спільну реалізацію через union-пропси.
 *
 * 25.07.2026, Фаза 5 (задачі 5.8/5.9): прогрес-бар і галочки "пройдено"
 * тепер РЕАЛЬНІ (не фейкові) — через новий `useProgress(courseId)`.
 * **Fixes/F.11 (04.08.2026):** для залогінених `useProgress` тепер читає
 * реальний прогрес із БД, не лише `localStorage` гостя — деталі в
 * докстрінгу самого хука (`lib/progress/useProgress.ts`). Те саме
 * бізнес-правило, що й усюди: уроки не блокуються, весь список завжди
 * клікабельний, галочка "пройдено" — інформаційна, не гейт.
 */
export function CourseLessonSidebar({
  courseId,
  courseSlug,
  lessons,
  activeLessonId,
  className,
}: CourseLessonSidebarProps) {
  const [open, setOpen] = useState(false);
  const { progress, hydrated } = useProgress(courseId);

  const completedCount = lessons.filter(
    (lesson) => progress[lesson.id]?.completed,
  ).length;
  const progressPercent =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <aside
      className={cn(
        "rounded-2xl border border-rose-line/40 bg-white shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 border-b border-rose-line/30 p-4 text-left lg:pointer-events-none"
      >
        <h2 className="font-serif text-lg text-ink">Програма курсу</h2>
        <ChevronDownIcon
          size={18}
          className={cn(
            "shrink-0 text-muted transition-transform lg:hidden",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Задача 5.8: прогрес-бар — лише коли гідратовано (щоб не блимнути
          0% до реального читання localStorage) і є хоч один урок. */}
      {hydrated && lessons.length > 0 && (
        <div className="border-b border-rose-line/30 px-4 py-3">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted">
            <span>Прогрес</span>
            <span>
              {completedCount} з {lessons.length}
            </span>
          </div>
          <ProgressBar value={progressPercent} size="sm" />
        </div>
      )}

      <nav
        className={cn(open ? "flex" : "hidden", "lg:flex flex-col gap-0.5 p-2")}
        aria-label="Список уроків курсу"
      >
        {lessons.map((lesson) => {
          const isCurrent = lesson.id === activeLessonId;
          // Задача 5.9: реальна галочка "пройдено" (не декоративна).
          const isCompleted = progress[lesson.id]?.completed ?? false;
          // Fix (04.08.2026): мініатюра уроку в сайдбарі — рахується з
          // `videoUrl` на льоту, той самий принцип, що й у `RealLessonCard.tsx`
          // (для реальних уроків тут нема готового `youtubeId`, як у
          // статичному `lib/data/lessons.ts`).
          const youtubeId =
            lesson.videoProvider === "YOUTUBE" ? extractYoutubeId(lesson.videoUrl) : null;

          return (
            <Link
              key={lesson.id}
              href={`/courses/${courseSlug}/lessons/${lesson.id}`}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 border-l-[3px] px-3 py-2.5 transition-colors",
                isCurrent
                  ? "border-accent bg-accent-soft/40"
                  : "border-transparent hover:bg-cream-soft/70",
              )}
            >
              <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg bg-ink">
                {youtubeId ? (
                  <Image
                    src={youtubeThumbnail(youtubeId)}
                    alt={lesson.title}
                    fill
                    sizes="64px"
                    className="object-cover opacity-90"
                    unoptimized
                  />
                ) : null}

                {(isCurrent || isCompleted) && (
                  <span
                    className={cn(
                      "absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full",
                      isCurrent ? "bg-accent text-white" : "bg-accent-soft text-accent-dark",
                    )}
                  >
                    {isCurrent ? <PlayIcon size={10} /> : <CheckIcon size={11} />}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <span
                  className={cn(
                    "text-[11px] font-medium",
                    isCurrent ? "text-accent-dark" : "text-muted",
                  )}
                >
                  Урок {lesson.order}
                </span>
                <h3
                  className={cn(
                    "mt-0.5 line-clamp-2 text-sm font-medium",
                    isCurrent ? "text-ink" : "text-ink/85 group-hover:text-ink",
                  )}
                >
                  {lesson.title}
                </h3>
                {lesson.duration && (
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
                    <ClockIcon size={11} />
                    {lesson.duration}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
