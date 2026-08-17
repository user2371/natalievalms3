"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UpsertArticleInput } from "./schema";
import * as service from "./service";

/**
 * `modules/articles/actions.ts` — Next.js server actions, викликають
 * лише `service.ts`. Мутація статті доступна тільки ролі `ADMIN` — той
 * самий обов'язковий server-side check, що й у `modules/lessons/actions.ts`
 * (принцип "не тільки в UI" з `CLAUDE.md`).
 */

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
}

/** Задача 8.3.3: збереження статті — upsert по lessonId. */
export async function upsertArticleAction(input: UpsertArticleInput) {
  try {
    await assertAdmin();
    const article = await service.upsertArticleService(input);
    revalidatePath(`/admin/courses`);
    revalidatePath(`/courses`);
    return { success: true as const, article, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося зберегти статтю";
    return { success: false as const, article: null, error: message };
  }
}
