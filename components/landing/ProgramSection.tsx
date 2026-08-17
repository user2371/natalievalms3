"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LessonCard } from "@/components/lesson/LessonCard";
import { RealLessonCard } from "@/components/lesson/RealLessonCard";
import { ArrowRightIcon } from "@/components/ui/icons";
import { LESSONS } from "@/lib/data/lessons";
import { useFeaturedCourse } from "@/lib/progress/useFeaturedCourse";
import type { Course as RealCourse } from "@/modules/courses";
import type { Lesson as RealLesson } from "@/modules/lessons";

export interface ProgramSectionProps {
  /**
   * Реальні (Prisma) курси + їхні уроки з БД — передаються з `app/page.tsx`
   * (Server Component), той самий проп `realCourses`, що й у `HeroSection`/
   * `MasterSection`, плюс мапа `courseId → Lesson[]` (задача 3.12). Секція
   * "містить" вибраний адміном статичний курс (`useFeaturedCourse`) з
   * реальним DB-курсом за `slug`: якщо є збіг І в реального курсу є хоч
   * один реальний урок — рендериться `RealLessonCard` замість статичних
   * `LESSONS`. Порожній/відсутній результат (БД недоступна) не ламає
   * секцію — просто лишається статичний фолбек, як і був.
   */
  realCourses?: RealCourse[];
  realLessonsByCourseId?: Record<string, RealLesson[]>;
}

export function ProgramSection({
  realCourses = [],
  realLessonsByCourseId = {},
}: ProgramSectionProps) {
  const { featuredCourse } = useFeaturedCourse();
  const realCourse = realCourses.find((course) => course.slug === featuredCourse.slug);
  const realLessons = realCourse ? (realLessonsByCourseId[realCourse.id] ?? []) : [];
  const usingRealLessons = realCourse !== undefined && realLessons.length > 0;

  const lessonsCount = usingRealLessons ? realLessons.length : LESSONS.length;
  const allLessonsHref = usingRealLessons ? `/courses/${realCourse!.slug}` : "/lessons";

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
                    courseSlug={realCourse!.slug}
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
