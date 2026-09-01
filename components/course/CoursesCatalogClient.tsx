"use client";

import { useMemo, useState } from "react";
import { CourseCard } from "@/components/course/CourseCard";
import { RealCourseCard } from "@/components/course/RealCourseCard";
import { Button } from "@/components/ui/Button";
import { GraduationCapIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { COURSES } from "@/lib/data/courses";
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
  const [category, setCategory] = useState<string>("all");

  const staticSlugs = useMemo(() => new Set(COURSES.map((c) => c.slug)), []);

  // Фільтри тепер будуються з реальних категорій курсів (`Course.categories`
  // з БД, задача CAT+), а не зі старого статичного одиничного поля
  // `category` в `lib/data/courses.ts` — щоб і пресетні, і кастомні
  // категорії, додані адміном, автоматично зʼявлялись тут. Показуються
  // лише категорії, які реально є хоча б в одному курсі — порожній
  // фільтр без жодного результату сенсу не має.
  const categoryFilters = useMemo(() => {
    const values = new Set<string>();
    realCourses.forEach((course) => course.categories.forEach((c) => values.add(c)));
    return Array.from(values).sort((a, b) => a.localeCompare(b, "uk"));
  }, [realCourses]);

  // Для статичного демо-курсу (`COURSES`, наразі лише "Гель-лак для
  // новачків") категорії беруться з відповідного реального курсу в БД за
  // `slug` — той самий "реальний" курс, той самий підхід, що вже
  // застосований для `coverImage`/`href` нижче. Якщо реального відповідника
  // немає (ще не створено в БД), картка вважається без категорій і
  // потрапляє лише під фільтр "Усі".
  const filteredStaticCourses = useMemo(() => {
    if (category === "all") return COURSES;
    return COURSES.filter((course) => {
      const realMatch = realCourses.find((real) => real.slug === course.slug);
      return realMatch?.categories.includes(category) ?? false;
    });
  }, [category, realCourses]);

  const extraRealCourses = useMemo(() => {
    const withoutStaticMatch = realCourses.filter((c) => !staticSlugs.has(c.slug));
    if (category === "all") return withoutStaticMatch;
    return withoutStaticMatch.filter((c) => c.categories.includes(category));
  }, [category, realCourses, staticSlugs]);

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
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-full border px-4 py-2 text-[13px] transition-colors",
            category === "all"
              ? "border-accent bg-accent text-white"
              : "border-rose-line bg-white text-ink hover:border-accent/60",
          )}
        >
          Усі курси
        </button>
        {categoryFilters.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={cn(
              "rounded-full border px-4 py-2 text-[13px] transition-colors",
              category === value
                ? "border-accent bg-accent text-white"
                : "border-rose-line bg-white text-ink hover:border-accent/60",
            )}
          >
            {value}
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
