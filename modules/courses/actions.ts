"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { CreateCourseInput, UpdateCourseInput } from "./schema";
import * as service from "./service";

/**
 * `modules/courses/actions.ts` (задача 3.4) — Next.js server actions,
 * викликають лише `service.ts`. Мутації курсу доступні тільки ролі `ADMIN`
 * — перевірка ролі ОБОВ'ЯЗКОВА тут, а не лише в UI/middleware (`/admin/*`
 * і так захищений `middleware.ts`, але той самий принцип "не тільки в UI",
 * задокументований у `CLAUDE.md`, вимагає дублювання перевірки на рівні
 * самого server action).
 */

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
}

export async function createCourseAction(input: CreateCourseInput) {
  try {
    await assertAdmin();
    const course = await service.createCourseService(input);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    return { success: true as const, course, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося створити курс";
    return { success: false as const, course: null, error: message };
  }
}

export async function updateCourseAction(input: UpdateCourseInput) {
  try {
    await assertAdmin();
    const course = await service.updateCourseService(input);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    revalidatePath(`/courses/${course.slug}`);
    return { success: true as const, course, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося оновити курс";
    return { success: false as const, course: null, error: message };
  }
}

export async function deleteCourseAction(id: string) {
  try {
    await assertAdmin();
    await service.deleteCourseService(id);
    revalidatePath("/admin/courses");
    revalidatePath("/courses");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося видалити курс";
    return { success: false as const, error: message };
  }
}
