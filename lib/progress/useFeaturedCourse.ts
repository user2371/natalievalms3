"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  featuredCourseHydrated,
  featuredCourseChanged,
} from "@/lib/store/slices/featuredCourseSlice";
import { COURSES, type Course } from "@/lib/data/courses";
import {
  getFeaturedCourseSlug,
  setFeaturedCourseSlug as persistFeaturedCourseSlug,
} from "@/lib/progress/localFeaturedCourse";

function resolveFeaturedCourse(slug: string | null): Course {
  return COURSES.find((c) => c.slug === slug) ?? COURSES[0];
}

/**
 * Курс, вибраний адміном для показу на головній сторінці (задача 0.20), і
 * сеттер для нього (`/admin/courses`).
 *
 * 23.07.2026: перенесено на Redux Toolkit (`lib/store/slices/featuredCourseSlice.ts`)
 * — вибір читає лендінг (`HeroSection`), а змінює адмінка
 * (`/admin/courses`), тож це кросскомпонентний стан. Стартує з `COURSES[0]`
 * на сервері/першому рендері (щоб уникнути hydration mismatch),
 * підвантажує реальний вибір з `localStorage` у `useEffect`. Якщо
 * збережений slug більше не існує в `COURSES` (курс видалили) — теж тихо
 * повертається до `COURSES[0]`.
 */
export function useFeaturedCourse() {
  const dispatch = useAppDispatch();
  const slug = useAppSelector((state) => state.featuredCourse.slug);
  const hydrated = useAppSelector((state) => state.featuredCourse.hydrated);

  useEffect(() => {
    if (hydrated) return;
    dispatch(featuredCourseHydrated(getFeaturedCourseSlug()));
  }, [hydrated, dispatch]);

  const featuredCourse = useMemo(() => resolveFeaturedCourse(slug), [slug]);

  const setFeaturedCourse = useCallback(
    (nextSlug: string) => {
      persistFeaturedCourseSlug(nextSlug);
      dispatch(featuredCourseChanged(nextSlug));
    },
    [dispatch],
  );

  return { featuredCourse, setFeaturedCourse };
}
