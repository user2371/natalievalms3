"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { cn } from "@/lib/utils";
import { useProgress } from "@/lib/progress/useProgress";
import type { Course as RealCourse } from "@/modules/courses";

export interface RealCourseCardProps {
  course: RealCourse;
  lessonsCount: number;
  className?: string;
}

/**
 * Картка РЕАЛЬНОГО (Prisma) курсу в каталозі `/courses` (задача 3.21) —
 * для курсів з БД, яких немає серед статичних `COURSES`
 * (`lib/data/courses.ts`). Паралельна `CourseCard.tsx` (той не чіпали),
 * бо реальний `Course` не має `category`/`level`/`free`/`studentsCount` —
 * полів, специфічних для макетного каталогу. Завжди клікабельна — реальний
 * курс з БД за визначенням "не макет".
 *
 * 25.07.2026, Фаза 5 (задача 5.11): прогрес-бар гостя через
 * `useProgress(course.id)` — показується лише коли гідратовано і в курсу
 * є хоч один урок ("прогрес-бар за наявності", а не завжди; 0%-бар для
 * курсу без жодного уроку не має сенсу). Компонент через це став
 * клієнтським ("use client") — його єдиний споживач,
 * `CoursesCatalogClient.tsx`, і так уже клієнтський.
 * Fixes/F.11: для залогінених — реальний прогрес із БД, не лише гостьовий.
 */
export function RealCourseCard({ course, lessonsCount, className }: RealCourseCardProps) {
  const { progress, hydrated } = useProgress(course.id);
  const completedCount = Object.values(progress).filter(
    (entry) => entry.completed,
  ).length;
  const progressPercent =
    lessonsCount > 0 ? Math.round((completedCount / lessonsCount) * 100) : 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[22px] border border-rose-line/50 bg-white transition-shadow hover:-translate-y-1 hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-accent-soft">
        {course.coverImage && (
          <Image
            src={course.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            unoptimized={course.coverImage.startsWith("http")}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        {course.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.categories.map((category) => (
              <span
                key={category}
                className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] text-accent-dark"
              >
                {category}
              </span>
            ))}
          </div>
        )}
        <h3 className="font-serif text-[19px] text-ink">{course.title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-muted">{course.description}</p>

        <div className="border-t border-cream-soft pt-3 text-xs text-muted">
          {lessonsCount} {lessonsCount === 1 ? "урок" : "уроків"}
        </div>

        {hydrated && lessonsCount > 0 && (
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
              <span>Твій прогрес</span>
              <span>
                {completedCount}/{lessonsCount}
              </span>
            </div>
            <ProgressBar value={progressPercent} size="sm" />
          </div>
        )}

        <span className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-accent-soft py-2.5 text-sm font-semibold text-accent-dark transition-colors group-hover:bg-accent group-hover:text-white">
          Переглянути курс
          <ArrowRightIcon size={15} />
        </span>
      </div>
    </Link>
  );
}
