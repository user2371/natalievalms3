"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  homeworkHydrated,
  homeworkSubmissionsUpdated,
} from "@/lib/store/slices/homeworkSlice";
import {
  getLocalHomeworkSubmissions,
  saveLocalHomeworkSubmission,
} from "@/lib/progress/localHomework";

/**
 * Хук для читання/здачі відео ДЗ гостя (`localStorage`).
 *
 * 23.07.2026: перенесено на Redux Toolkit (`lib/store/slices/homeworkSlice.ts`),
 * той самий принцип, що й `useLocalProgress` — стан ділять кілька сторінок
 * (`HomeworkBlock` на уроці, `/profile`, `/my-learning`, `/homework`,
 * `/users/[id]`). Зовнішній API (`{ submissions, submit }`) не змінився.
 */
export function useLocalHomework() {
  const dispatch = useAppDispatch();
  const submissions = useAppSelector((state) => state.homework.submissions);
  const hydrated = useAppSelector((state) => state.homework.hydrated);

  useEffect(() => {
    if (hydrated) return;
    dispatch(homeworkHydrated(getLocalHomeworkSubmissions()));
  }, [hydrated, dispatch]);

  const submit = useCallback(
    (lessonSlug: string, videoUrl: string) => {
      dispatch(
        homeworkSubmissionsUpdated(saveLocalHomeworkSubmission(lessonSlug, videoUrl)),
      );
    },
    [dispatch],
  );

  return { submissions, submit };
}
