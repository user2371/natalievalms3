"use client";

import { useCallback } from "react";
import { useAppDispatch } from "@/lib/store/hooks";
import { progressSyncToastShown } from "@/lib/store/slices/progressSyncToastSlice";
import { getAllLocalProgress, clearLocalProgress } from "@/lib/progress/localProgress";
import { syncLocalProgressAction } from "@/modules/progress";
import type { UpsertProgressEntry } from "@/modules/progress";

/**
 * `lib/progress/useProgressSync.ts` (задача 7.6) — клієнтський хук:
 * після успішного логіну/реєстрації прочитати `localStorage` і викликати
 * `syncLocalProgressAction`. Викликається явно з `LoginScreen`/
 * `RegisterScreen` (не через генеричний `useSession()`-вотчер — так
 * спрацьовує РІВНО раз, точно в момент логіну/реєстрації, а не при
 * кожному відкритті вже залогіненої сесії).
 */
export function useProgressSync() {
  const dispatch = useAppDispatch();

  const syncProgress = useCallback(async () => {
    const allProgress = getAllLocalProgress();
    const entries: UpsertProgressEntry[] = [];

    for (const [courseId, lessons] of Object.entries(allProgress)) {
      for (const [lessonId, entry] of Object.entries(lessons)) {
        entries.push({
          courseId,
          lessonId,
          completed: entry.completed,
          quizScore: entry.quizScore,
          quizTotal: entry.quizTotal,
          updatedAt: entry.updatedAt,
        });
      }
    }

    // Задача 7.8: немає локальних даних (юзер раніше проходив курси вже
    // залогіненим на цьому пристрої, або прогрес уже був синхронізований
    // і localStorage порожній) — нічого не робимо, без зайвого виклику
    // сервера й без тосту.
    if (entries.length === 0) return;

    const result = await syncLocalProgressAction({ entries });

    if (result.success) {
      // Задача 7.7: очищаємо localStorage ЛИШЕ після підтвердженого
      // успіху sync.
      clearLocalProgress();
      dispatch(
        progressSyncToastShown({
          message: "Прогрес синхронізовано",
          variant: "success",
        }),
      );
    } else {
      // Задача 7.12: НЕ чіпаємо localStorage при помилці мережі/сервера —
      // дані гостя не втрачаються, спроба повториться при наступному
      // логіні (`entries.length === 0` тоді буде хибним, бо storage й
      // далі не порожній).
      dispatch(
        progressSyncToastShown({
          message: "Не вдалося синхронізувати прогрес. Спробуємо ще раз пізніше.",
          variant: "error",
        }),
      );
    }
  }, [dispatch]);

  return { syncProgress };
}
