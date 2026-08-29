"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/components/course/CourseCard";
import { RealCourseCard } from "@/components/course/RealCourseCard";
import { Button } from "@/components/ui/Button";
import { GraduationCapIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { COURSES, COURSE_FILTERS, type CourseCategory } from "@/lib/data/courses";
import type { Course as RealCourse } from "@/modules/courses";

export interface CoursesCatalogClientProps {
  /**
   * Реальні (Prisma) курси з БД (задача 3.21) — передаються з
   * `app/courses/page.tsx` (Server Component). Кожен статичний курс
   * (`COURSES`), для якого є реальний курс з тим самим `slug`, отримує
   * посилання на реальний роут `/courses/[slug]` (задача 3.14) замість
   * застарілого хардкоду `/lessons` — через `CourseCard`'s `href`-проп.
   * Реальні курси, яких немає серед статичних `COURSES` (наприклад, новий
   * курс, створений адміном у майбутньому), додаються в кінець сітки як
   * окремі картки (`RealCourseCard`) — так каталог реально масштабується
   * на декілька курсів, а не лишається намертво прив'язаним до 6
   * макетних записів.
   */
  realCourses: RealCourse[];
  realLessonCountsByCourseId: Record<string, number>;
}

export function CoursesCatalogClient({
  realCourses,
  realLessonCountsByCourseId,
}: CoursesCatalogClientProps) {
  const [category, setCategory] = useState<CourseCategory | "all">("all");

  const filteredStaticCourses = useMemo(() => {
    if (category === "all") return COURSES;
    return COURSES.filter((course) => course.category === category);
  }, [category]);

  const staticSlugs = useMemo(() => new Set(COURSES.map((c) => c.slug)), []);
  // Реальні курси без відповідника серед статичних — показуються лише при
  // фільтрі "Усі" (у них немає `category`, тому "потрапляти" в конкретний
  // фільтр коректно не можуть).
  const extraRealCourses =
    category === "all" ? realCourses.filter((c) => !staticSlugs.has(c.slug)) : [];

  const hasAnyResults = filteredStaticCourses.length > 0 || extraRealCourses.length > 0;

  // Задача 9.1: "на сайті взагалі немає жодного курсу" — окремий, більш
  // радикальний порожній стан, ніж "у цій категорії немає курсів" (нижче).
  // Рахується незалежно від активного фільтра (усі статичні COURSES +
  // усі реальні DB-курси), щоб перемикання категорій у цьому випадку не
  // пропонувалось як вихід — його просто нема з чого пропонувати.
  const hasAnyCourseOnSite = COURSES.length > 0 || realCourses.length > 0;

  return (
    <>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {COURSE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setCategory(filter.value)}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] transition-colors",
              category === filter.value
                ? "border-accent bg-accent text-white"
                : "border-rose-line bg-white text-ink hover:border-accent/60",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {hasAnyResults ? (
        <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStaticCourses.map((course) => {
            const realMatch = realCourses.find((real) => real.slug === course.slug);
            return (
              <CourseCard
                key={course.slug}
                course={course}
                href={realMatch ? `/courses/${realMatch.slug}` : undefined}
                coverImageOverride={realMatch?.coverImage}
              />
            );
          })}
          {extraRealCourses.map((course) => (
            <RealCourseCard
              key={course.id}
              course={course}
              lessonsCount={realLessonCountsByCourseId[course.id] ?? 0}
            />
          ))}
        </div>
      ) : hasAnyCourseOnSite ? (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-rose-line/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
            <GraduationCapIcon size={24} />
          </span>
          <div>
            <p className="font-serif text-xl text-ink">Курсів поки немає</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              У цій категорії ще немає курсів. Спробуй обрати інший напрямок або перевір
              усі курси.
            </p>
          </div>
          <Button size="sm" onClick={() => setCategory("all")}>
            Переглянути всі курси
          </Button>
        </div>
      ) : (
        <div className="mt-10 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-rose-line/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
            <GraduationCapIcon size={24} />
          </span>
          <div>
            <p className="font-serif text-xl text-ink">
              На сайті поки немає жодного курсу
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Ми готуємо перші курси — повертайся трохи пізніше, тут з&apos;явиться повна
              програма навчання.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
