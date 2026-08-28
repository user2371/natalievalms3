"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UpsertHomeworkAssignmentInput } from "./schema";
import * as service from "./service";
import { uploadHomeworkImageService } from "./uploadService";

/**
 * `modules/homeworkAssignments/actions.ts` — ФАЗА HW+, задача HW+.1.5.
 * Next.js server actions, викликають лише `service.ts`/`uploadService.ts`.
 * Мутація доступна тільки ролі `ADMIN` — той самий обов'язковий
 * server-side check (принцип "не тільки в UI" з `CLAUDE.md`), що вже в
 * `modules/articles/actions.ts`. Кнопка "Додати ДЗ"/маршрут `.../homework`
 * і так недосяжні не-адміну через захист `/admin/*` (ADMIN+) — це другий,
 * незалежний рубіж на рівні самої дії (HW+.5.1).
 */
async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
}

/** Збереження опису домашнього завдання — upsert по lessonId. */
export async function upsertHomeworkAssignmentAction(input: UpsertHomeworkAssignmentInput) {
  try {
    await assertAdmin();
    const assignment = await service.upsertHomeworkAssignmentService(input);
    revalidatePath(`/courses/[slug]/lessons/[lessonId]`, "page");
    revalidatePath(`/admin/courses`);
    return { success: true as const, assignment, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося зберегти домашнє завдання";
    return { success: false as const, assignment: null, error: message };
  }
}

/** Завантаження зображення, вставленого адміном у текст завдання ДЗ. */
export async function uploadHomeworkImageAction(formData: FormData) {
  try {
    await assertAdmin();

    const lessonId = formData.get("lessonId");
    const image = formData.get("image");

    if (typeof lessonId !== "string" || !lessonId) {
      throw new Error("Не вказано ID уроку");
    }
    if (!(image instanceof File)) {
      throw new Error("Не передано файл зображення");
    }

    const result = await uploadHomeworkImageService(lessonId, image);
    return { success: true as const, url: result.url, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося завантажити зображення";
    return { success: false as const, url: null, error: message };
  }
}
