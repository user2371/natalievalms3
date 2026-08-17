"use client";

import { HomeIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/Select";
import { COURSES } from "@/lib/data/courses";
import { useFeaturedCourse } from "@/lib/progress/useFeaturedCourse";

/**
 * `components/admin/FeaturedCoursePicker.tsx` — блок "Курс на головній
 * сторінці" (задача 0.20), винесений в окремий клієнтський компонент,
 * коли `app/admin/courses/page.tsx` перетворився на Server Component
 * (задача 8.1.1). Сам функціонал НЕ змінювався — той самий `Select` з
 * `COURSES` (публічний демо-каталог лендінгу, НЕ `modules/courses`,
 * навмисно — див. докстрінг `app/admin/courses/page.tsx`) і
 * `useFeaturedCourse`/`localStorage`, просто перенесений сюди дослівно.
 */
export function FeaturedCoursePicker() {
  const { featuredCourse, setFeaturedCourse } = useFeaturedCourse();

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-rose-line/40 bg-white p-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
          <HomeIcon size={18} />
        </span>
        <div>
          <label htmlFor="featured-course" className="text-sm font-medium text-ink">
            Курс на головній сторінці
          </label>
          <p className="mt-1 max-w-md text-xs text-muted">
            Цей курс показується в hero-блоці лендінгу — опис, кількість уроків і кнопка
            &quot;Почати навчання&quot;.
          </p>
        </div>
      </div>
      <div className="w-full sm:w-72">
        <Select
          id="featured-course"
          value={featuredCourse.slug}
          onChange={(e) => setFeaturedCourse(e.target.value)}
          options={COURSES.map((course) => ({
            value: course.slug,
            label: course.available ? course.title : `${course.title} (Незабаром)`,
          }))}
        />
      </div>
    </div>
  );
}
