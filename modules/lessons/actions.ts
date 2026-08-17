"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { CreateLessonInput, ReorderLessonsInput, UpdateLessonInput } from "./schema";
import * as service from "./service";

/**
 * `modules/lessons/actions.ts` (задача 3.9) — Next.js server actions,
 * викликають лише `service.ts`. Мутації уроку доступні тільки ролі `ADMIN`
 * — той самий обов'язковий server-side check, що й у
 * `modules/courses/actions.ts` (принцип "не тільки в UI/middleware" з
 * `CLAUDE.md`).
 */

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
}

export async function createLessonAction(input: CreateLessonInput) {
  try {
    await assertAdmin();
    const lesson = await service.createLessonService(input);
    revalidatePath("/admin/courses");
    revalidatePath(`/courses/${input.courseId}`);
    return { success: true as const, lesson, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося створити урок";
    return { success: false as const, lesson: null, error: message };
  }
}

export async function updateLessonAction(input: UpdateLessonInput) {
  try {
    await assertAdmin();
    const lesson = await service.updateLessonService(input);
    revalidatePath("/admin/courses");
    revalidatePath(`/courses/${lesson.courseId}`);
    return { success: true as const, lesson, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося оновити урок";
    return { success: false as const, lesson: null, error: message };
  }
}

export async function deleteLessonAction(id: string) {
  try {
    await assertAdmin();
    await service.deleteLessonService(id);
    revalidatePath("/admin/courses");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося видалити урок";
    return { success: false as const, error: message };
  }
}

export async function reorderLessonsAction(input: ReorderLessonsInput) {
  try {
    await assertAdmin();
    const lessons = await service.reorderLessonsService(input);
    revalidatePath("/admin/courses");
    revalidatePath(`/courses/${input.courseId}`);
    return { success: true as const, lessons, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося змінити порядок уроків";
    return { success: false as const, lessons: null, error: message };
  }
}

/**
 * Fixes (02.08.2026, задача F.6) — на відміну від усіх дій вище, це НЕ
 * адмінська дія: будь-який залогінений користувач читає ЛИШЕ ВЛАСНИЙ
 * прогрес (`userId` — з сесії, не з клієнта, той самий принцип, що й
 * `submitHomeworkAction`) по конкретному курсу — для реального чекліста
 * уроків на `/my-learning`.
 */
export async function getLessonsWithCompletionAction(courseId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти");
    }

    const lessons = await service.listLessonsWithCompletionService(courseId, userId);
    return { success: true as const, lessons, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося завантажити уроки";
    return { success: false as const, lessons: [], error: message };
  }
}
