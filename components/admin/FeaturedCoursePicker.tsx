"use client";

import { useState } from "react";
import { HomeIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/Select";
import { setFeaturedCourseAction, clearFeaturedCourseAction } from "@/modules/siteSettings";
import type { Course } from "@/modules/courses";

const CLEAR_VALUE = "";

export interface FeaturedCoursePickerProps {
  /** Реальні курси (`modules/courses`), уже завантажені сервером у `app/admin/courses/page.tsx`. */
  courses: Course[];
  /** Поточний featured-курс (`id`) — `null`, якщо ще не обрано / знято з публікації / видалено. */
  featuredCourseId: string | null;
}

/**
 * Блок "Курс на головній сторінці" (задача 0.20 → HOME+.3.2) — раніше
 * зберігав вибір лише в `localStorage` (клієнтський, прив'язаний до
 * браузера, показував список зі СТАТИЧНОГО демо-каталогу
 * `lib/data/courses.ts`, не з реальних курсів). Тепер: реальні
 * опубліковані курси (`modules/courses`), вибір зберігається на сервері
 * (`modules/siteSettings`, `SiteSettings.featuredCourseId`) — видимий
 * усім відвідувачам сайту, а не лише в тому самому браузері адміна.
 */
export function FeaturedCoursePicker({ courses, featuredCourseId }: FeaturedCoursePickerProps) {
  const publishedCourses = courses.filter((course) => course.published);

  const [value, setValue] = useState(featuredCourseId ?? CLEAR_VALUE);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(nextValue: string) {
    const previousValue = value;
    setValue(nextValue);
    setPending(true);
    setError(null);

    const result =
      nextValue === CLEAR_VALUE
        ? await clearFeaturedCourseAction()
        : await setFeaturedCourseAction(nextValue);

    setPending(false);

    if (!result.success) {
      setValue(previousValue);
      setError(result.error ?? "Не вдалося зберегти вибір курсу");
    }
  }

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
            Цей курс показується на лендінгу — опис і кількість уроків у hero-блоці,
            секція "Про курс" і кількість уроків у "Програмі курсу".
          </p>
          {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
      </div>
      <div className="w-full sm:w-72">
        <Select
          id="featured-course"
          value={value}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value)}
          options={[
            { value: CLEAR_VALUE, label: "Не показувати жоден курс" },
            ...publishedCourses.map((course) => ({
              value: course.id,
              label: course.title,
            })),
          ]}
        />
      </div>
    </div>
  );
}
