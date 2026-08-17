"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  homeworkVisibilityHydrated,
  homeworkVisibilityChanged,
} from "@/lib/store/slices/settingsSlice";
import {
  getHomeworkVisible,
  setHomeworkVisible as persistHomeworkVisible,
} from "@/lib/progress/localSettings";

/**
 * Чи власник дозволив показувати секцію "Домашні завдання" на своєму
 * публічному профілі (задача 0.9.5), і перемикач для цього значення
 * (задача 0.10.6, `/settings`).
 *
 * 23.07.2026: перенесено на Redux Toolkit (`lib/store/slices/settingsSlice.ts`)
 * — значення читає й публічний `/users/[id]`, і сама сторінка
 * `/settings`, тож це кросскомпонентний стан. Стартує з `true` на
 * сервері/першому рендері (щоб уникнути hydration mismatch), підвантажує
 * реальне значення в `useEffect`. `setHomeworkVisible` одразу пише в
 * `localStorage` і в store — перемикач у Налаштуваннях застосовується
 * миттєво, без кнопки "Зберегти", як і раніше.
 */
export function useHomeworkVisibility() {
  const dispatch = useAppDispatch();
  const homeworkVisible = useAppSelector((state) => state.settings.homeworkVisible);
  const hydrated = useAppSelector((state) => state.settings.hydrated);

  useEffect(() => {
    if (hydrated) return;
    dispatch(homeworkVisibilityHydrated(getHomeworkVisible()));
  }, [hydrated, dispatch]);

  const setHomeworkVisible = useCallback(
    (visible: boolean) => {
      persistHomeworkVisible(visible);
      dispatch(homeworkVisibilityChanged(visible));
    },
    [dispatch],
  );

  return { homeworkVisible, setHomeworkVisible };
}
