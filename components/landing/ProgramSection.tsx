import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LessonCard } from "@/components/lesson/LessonCard";
import { RealLessonCard } from "@/components/lesson/RealLessonCard";
import { ArrowRightIcon } from "@/components/ui/icons";
import { LESSONS } from "@/lib/data/lessons";
import type { Course as RealCourse } from "@/modules/courses";
import type { Lesson as RealLesson } from "@/modules/lessons";

export interface ProgramSectionProps {
  /**
   * Featured-курс, вибраний адміном (`modules/siteSettings`, ФАЗА
   * HOME+) — вантажиться на сервері в `app/page.tsx` і передається
   * сюди готовим, разом з мапою `courseId → Lesson[]` (задача 3.12).
   * `null` — немає featured-курсу (ще не обрано / знято з публікації /
   * видалено), секція лишається на статичному фолбеку `LESSONS`.
   *
   * ДО ФАЗИ HOME+ секція сама шукала відповідний реальний курс за
   * `slug` серед `realCourses` (задокументована проблема 0.20.1) —
   * тепер це робить `app/page.tsx`, тут лише готовий об'єкт.
   */
  featuredCourse?: RealCourse | null;
  realLessonsByCourseId?: Record<string, RealLesson[]>;
}

/**
 * Секцію переведено назад на Server Component (задача HOME+.6.2) —
 * єдиною причиною `"use client"` тут раніше був клієнтський хук
 * `useFeaturedCourse`; після переходу на серверний `featuredCourse`-проп
 * клієнтських хуків у секції більше немає.
 */
export function ProgramSection({
  featuredCourse = null,
  realLessonsByCourseId = {},
}: ProgramSectionProps) {
  const realLessons = featuredCourse
    ? (realLessonsByCourseId[featuredCourse.id] ?? [])
    : [];
  const usingRealLessons = featuredCourse !== null && realLessons.length > 0;

  const lessonsCount = usingRealLessons ? realLessons.length : LESSONS.length;
  const allLessonsHref = usingRealLessons ? `/courses/${featuredCourse!.slug}` : "/lessons";

  return (
    <section id="program" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div>
          <div className="text-center">
            <h2 className="mt-2 font-serif text-3xl text-ink sm:text-4xl ">
              Програма курсу{" "}
              <Badge className="border bg-transparent">{lessonsCount}+ уроків</Badge>
            </h2>
            <p className="mt-2  text-sm text-muted sm:text-base">
              Усі уроки відкриті одразу — дивись у зручному темпі й порядку, без обмежень
              доступу.
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {usingRealLessons
            ? realLessons
                .slice(0, 4)
                .map((lesson) => (
                  <RealLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    courseSlug={featuredCourse!.slug}
                    className="w-full"
                  />
                ))
            : LESSONS.slice(0, 4).map((lesson) => (
                <LessonCard key={lesson.slug} lesson={lesson} className="w-full" />
              ))}

          <Link
            href={allLessonsHref}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-rose-line/40 bg-accent-soft/40 p-6 text-center transition-shadow hover:shadow-md"
          >
            <span className="font-serif text-4xl text-accent-dark">{lessonsCount}</span>
            <span className="text-sm font-medium text-ink">Всі уроки</span>
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-accent-dark">
              Переглянути програму
              <ArrowRightIcon size={14} />
            </span>
          </Link>
        </div>

        <Link href={allLessonsHref} className="mt-6 block sm:hidden">
          <Button variant="outline" fullWidth icon={<ArrowRightIcon size={17} />}>
            Переглянути всі уроки
          </Button>
        </Link>
      </div>
    </section>
  );
}
