"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UpdateUserRoleInput } from "./schema";
import * as service from "./service";

/**
 * ADMIN+.1 (09.08.2026): раніше лише перевіряла роль ("assertAdmin"), тепер
 * ще й повертає дані поточного адміна ("actor") — потрібні сервісу для
 * самозахисту (не можна змінити власну роль) і для аудиту (хто останній
 * змінив роль конкретного юзера, `roleChangedByLabel`).
 */
async function requireAdmin(): Promise<service.RoleChangeActor> {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; name?: string; email?: string; nickname?: string }
    | undefined;
  if (user?.role !== "ADMIN" || !user.id) {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
  return {
    userId: user.id,
    name: user.name ?? "",
    email: user.email ?? "",
    nickname: user.nickname ?? null,
  };
}

export async function updateUserRoleAction(input: UpdateUserRoleInput) {
  try {
    const actor = await requireAdmin();
    const user = await service.updateUserRoleService(input, actor);
    revalidatePath("/admin/users");
    return { success: true as const, user, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося оновити роль користувача";
    return { success: false as const, user: null, error: message };
  }
}
