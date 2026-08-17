"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SubmitHomeworkInput } from "./schema";
import * as service from "./service";

/**
 * `modules/homework/actions.ts` — Next.js server action, викликає лише
 * `service.ts`, той самий поділ, що й у `modules/comments/actions.ts`.
 *
 * Лише авторизовані — `userId` береться з сесії (не з клієнта), той самий
 * принцип, що й `addCommentAction`. На UI гість взагалі не бачить форму
 * (`GuestHomeworkBanner` замість неї, той самий патерн, що вже в легасі
 * `HomeworkBlock.tsx`, не чіпали), але дія все одно перевіряє сесію сама —
 * "не тільки в UI" (`CLAUDE.md`).
 *
 * `revalidatePath` — не для самої сторінки уроку (та оновлюється локальним
 * React-станом клієнтського `RealHomeworkBlock`, той самий підхід, що й
 * `RealCommentsBlock`), а для інших сторінок, які кешовано читають ці дані:
 * `/users/[id]` (публічний профіль одразу показує нове відео) та
 * `/my-learning`.
 */
export async function submitHomeworkAction(input: SubmitHomeworkInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб здати домашнє завдання");
    }

    const submission = await service.submitHomeworkService(userId, input);
    revalidatePath("/users/[id]", "page");
    revalidatePath("/my-learning");
    return { success: true as const, submission, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося здати домашнє завдання";
    return { success: false as const, submission: null, error: message };
  }
}
