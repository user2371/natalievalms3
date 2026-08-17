"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { UpdateBioSchema } from "./schema";
import * as service from "./service";

/**
 * `modules/profile/actions.ts` (задача 6.6.17) — action `getPublicProfile`,
 * БЕЗ перевірки сесії (публічний доступ — той самий принцип, що й
 * `getLeaderboardAction`/`getUserPointsAction`: профіль користувача може
 * переглянути будь-хто, залогінений чи ні). `updateHomeworkVisibilityAction`
 * (задача 9.15, додано пізніше) — навпаки, лише для залогіненого власника.
 */
export async function getPublicProfileAction(userId: string) {
  try {
    const profile = await service.getPublicProfileService(userId);
    if (!profile) {
      return { success: false as const, profile: null, error: "Профіль не знайдено" };
    }
    return { success: true as const, profile, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося завантажити профіль";
    return { success: false as const, profile: null, error: message };
  }
}

/**
 * Задача 9.15 (виправлення прогалини 2) — `updateHomeworkVisibility`:
 * пише в `User.homeworkVisible` ЛИШЕ для поточного залогіненого
 * користувача (`userId` з сесії, не з клієнта — той самий принцип, що й
 * `addCommentAction`); анонім чи чужий `userId` тут неможливі.
 */
export async function updateHomeworkVisibilityAction(homeworkVisible: boolean) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб змінити налаштування");
    }

    await service.updateHomeworkVisibilityService(userId, homeworkVisible);
    revalidatePath("/users/[id]", "page");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося зберегти налаштування";
    return { success: false as const, error: message };
  }
}

/**
 * Задача 3+.4.3 — той самий формат `{ success, error }`, той самий
 * принцип перевірки сесії, що й `updateHomeworkVisibilityAction` вище.
 * `UpdateBioSchema.parse` (3+.4.1) — та сама межа в 500 символів, що вже
 * в UI-лічильнику, але тут це РЕАЛЬНА серверна перевірка (клієнтський
 * `maxLength` на `Textarea` — лише зручність, як і всюди в проєкті).
 * `revalidatePath("/users/[id]", "page")` — той самий шаблон динамічного
 * шляху, що вже в `updateHomeworkVisibilityAction`: публічний профіль
 * (`/users/[id]`) показує `bio` іншим користувачам, тому кеш цієї
 * сторінки теж треба інвалідувати після зміни.
 */
export async function updateBioAction(about: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб змінити налаштування");
    }

    const validated = UpdateBioSchema.parse({ about });
    await service.updateBioService(userId, validated.about);
    revalidatePath("/users/[id]", "page");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося зберегти опис";
    return { success: false as const, error: message };
  }
}
