"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import type { UpsertProgressInput } from "./schema";
import * as service from "./service";

/**
 * `modules/progress/actions.ts` (задача 7.4) — server action
 * `syncLocalProgress`, лише перевіряє сесію (валідація вхідних даних —
 * у `service.ts`, той самий поділ, що й у решті модулів).
 */
export async function syncLocalProgressAction(input: UpsertProgressInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб синхронізувати прогрес");
    }

    const progress = await service.syncLocalProgressService(userId, input);
    revalidatePath("/my-learning");
    return { success: true as const, progress, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося синхронізувати прогрес";
    return { success: false as const, progress: [], error: message };
  }
}

/**
 * Fixes/F.11: read-шлях для залогіненого юзера — реальний прогрес курсу з
 * БД у форматі `CourseProgressMap`. На відміну від `syncLocalProgressAction`
 * НЕ кидає помилку для гостя — просто повертає порожню мапу (`{}`), бо
 * виклик з `useProgress` відбувається завжди, і `status !== "authenticated"`
 * — легітимний, очікуваний випадок (гість), а не збій.
 *
 * Fixes/F.12: обгорнуто в try/catch — цей шлях РАНІШЕ не мав жодного
 * реального виконання (мертва `findByUserAndCourse` з Фази 7 ніде не
 * викликалась), тож перший-ліпший реальний збій БД (на відміну від уже
 * "обкатаного" `syncLocalProgressAction`) призводив до НЕОБРОБЛЕНОГО
 * відхилення проміса на клієнті — `useProgress` ніколи не дораховував
 * `dispatch(courseProgressHydrated(...))`, і `hydrated` лишався `false`
 * НАЗАВЖДИ для сторінки (кнопка "Позначити пройденим" — `disabled={!hydrated}`
 * — залипала вимкненою, сайдбар/картки застрягали на 0%). Тепер при
 * помилці повертається порожня мапа (як і для гостя) замість падіння —
 * `useProgress` унизу підстрахований додатково (fallback на локальні дані),
 * але основний захист — тут.
 */
export async function getCourseProgressAction(courseId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return {};
    }
    return await service.getCourseProgressMapService(userId, courseId);
  } catch (err) {
    console.error("Не вдалося завантажити прогрес курсу з БД:", err);
    return {};
  }
}
