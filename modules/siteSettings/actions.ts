"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SetFeaturedCourseSchema } from "./schema";
import * as service from "./service";

/**
 * `modules/siteSettings/actions.ts` (задача HOME+.1.4) — server actions,
 * викликають лише `service.ts`. Мутації — лише роль `ADMIN` (той самий
 * `assertAdmin()` патерн, що в `modules/courses/actions.ts`).
 */

async function assertAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
}

/**
 * Після зміни featured-курсу — `revalidatePath("/")`, інакше зміна не
 * з'явиться на лендінгу без повного редеплою (`app/page.tsx` рендериться
 * динамічно, задача HOME+.5.2, але серверний кеш даних все одно варто
 * скинути явно).
 */
export async function setFeaturedCourseAction(courseId: string) {
  try {
    await assertAdmin();

    const parsed = SetFeaturedCourseSchema.safeParse({ courseId });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
    }

    await service.setFeaturedCourseService(parsed.data.courseId);
    revalidatePath("/");
    revalidatePath("/admin/courses");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося зберегти вибір курсу";
    return { success: false as const, error: message };
  }
}

export async function clearFeaturedCourseAction() {
  try {
    await assertAdmin();
    await service.clearFeaturedCourseService();
    revalidatePath("/");
    revalidatePath("/admin/courses");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося скинути вибір";
    return { success: false as const, error: message };
  }
}

/**
 * Публічна дія (БЕЗ `assertAdmin`) — читання featured-курсу не приватне,
 * той самий рівень відкритості, що вже `getUserPointsAction`
 * (`modules/points/actions.ts`). Придатна і для серверного виклику з
 * `app/page.tsx`.
 */
export async function getFeaturedCourseAction() {
  return service.getFeaturedCourseService();
}
