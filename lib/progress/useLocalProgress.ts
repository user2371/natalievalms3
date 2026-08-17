"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { progressHydrated, lessonMarkedComplete } from "@/lib/store/slices/progressSlice";
import { getLocalProgress, setLessonCompleted } from "@/lib/progress/localProgress";

/**
 * Легасі-хук для єдиного статичного курсу (`/lessons`, `/lessons/[slug]`,
 * `/profile`, `/my-learning`, `/homework`, `/users/[id]`) — жодних правок
 * у 6 споживачах не знадобилось ні під час переходу на RTK (23.07.2026),
 * ні тепер, під час Фази 5 (25.07.2026).
 *
 * 25.07.2026, Фаза 5: `lib/progress/localProgress.ts` перейшов з плаского
 * `Set<slug>` на namespaced-за-courseId мапу з результатом квізу (задачі
 * 5.1–5.6). Цей хук — міст сумісності: зовні й далі повертає
 * `{ completedSlugs: Set<string>, markComplete(slug) }`, а всередині
 * читає/пише через нове сховище з фіксованим `LEGACY_STATIC_COURSE_ID`
 * (єдиний реальний курс, що існував до появи `modules/courses`, той
 * самий slug, що й `COURSES[0].slug`/реальний seed-курс). Для нового,
 * по-справжньому courseId-параметризованого доступу — новий
 * `useProgress(courseId)` (задача 5.7, `lib/progress/useProgress.ts`),
 * призначений для сторінок з реальними (Prisma) курсами/уроками.
 */
const LEGACY_STATIC_COURSE_ID = "gel-lak-dlya-novachkiv";

export function useLocalProgress() {
  const dispatch = useAppDispatch();
  const completedSlugsArray = useAppSelector((state) => state.progress.completedSlugs);
  const hydrated = useAppSelector((state) => state.progress.hydrated);

  useEffect(() => {
    if (hydrated) return;
    const progressMap = getLocalProgress(LEGACY_STATIC_COURSE_ID);
    const completedIds = Object.entries(progressMap)
      .filter(([, entry]) => entry.completed)
      .map(([lessonId]) => lessonId);
    dispatch(progressHydrated(completedIds));
  }, [hydrated, dispatch]);

  // Зовнішній API хука історично повертає `Set` (компоненти-споживачі
  // роблять `completedSlugs.has(slug)`) — конвертуємо на межі, у store
  // тримаємо серіалізовний масив.
  const completedSlugs = useMemo(
    () => new Set(completedSlugsArray),
    [completedSlugsArray],
  );

  const markComplete = useCallback(
    (slug: string) => {
      setLessonCompleted(LEGACY_STATIC_COURSE_ID, slug);
      dispatch(lessonMarkedComplete(slug));
    },
    [dispatch],
  );

  return { completedSlugs, markComplete };
}
