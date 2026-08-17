"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { isCommentRateLimited, recordCommentAttempt } from "@/lib/comments/rateLimit";
import { CreateCommentInput, DeleteCommentInput, ReactToCommentInput } from "./schema";
import * as service from "./service";

/**
 * `modules/comments/actions.ts` (задачі 6.5.4/6.5.5) — Next.js server
 * actions, викликають лише `service.ts`, той самий поділ, що й у
 * `modules/quizzes/actions.ts`.
 */

/**
 * Задача 6.5.4: `addComment` — лише авторизовані, `userId` береться з
 * сесії (не з клієнта), той самий принцип, що вже застосований у
 * `submitQuizResultAction` (`modules/quizzes/actions.ts`).
 *
 * Задача 6.5.18: базовий анти-спам throttle (`lib/comments/rateLimit.ts`)
 * — перевіряється ПЕРЕД викликом `service`, щоб не робити зайвий запит
 * до БД для завідомо відхиленого коментаря; лічильник оновлюється лише
 * після УСПІШНОГО додавання (невдала спроба через валідацію не "з'їдає"
 * ліміт користувача).
 */
export async function addCommentAction(input: CreateCommentInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб залишити коментар");
    }

    if (isCommentRateLimited(userId)) {
      throw new Error("Зачекайте кілька секунд перед наступним коментарем");
    }

    const comment = await service.addCommentService(userId, input);
    recordCommentAttempt(userId);
    revalidatePath("/lessons");
    return { success: true as const, comment, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося додати коментар";
    return { success: false as const, comment: null, error: message };
  }
}

/**
 * Задача 6.5.5: `deleteComment` — тільки admin або автор коментаря.
 * Перевірка сесії тут (доступ заборонено гостю), сама авторизація
 * "admin або автор" — у `service.ts` (`deleteCommentService`).
 */
export async function deleteCommentAction(input: DeleteCommentInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб видалити коментар");
    }

    const comment = await service.deleteCommentService(userId, role ?? "USER", input);
    revalidatePath("/lessons");
    return { success: true as const, comment, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося видалити коментар";
    return { success: false as const, comment: null, error: message };
  }
}

/**
 * Задача 6.5.24: `reactToComment` — лише авторизовані (`userId` з сесії, той
 * самий принцип, що й `addCommentAction`); гість не проходить сюди взагалі
 * — на UI його клік відкриває AuthModal ще ДО виклику цієї дії (задача
 * 6.5.25, `CommentCard.handleToggle`, не чіпали).
 */
export async function reactToCommentAction(input: ReactToCommentInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб оцінити коментар");
    }

    const result = await service.reactToCommentService(userId, input);
    revalidatePath("/lessons");
    return { success: true as const, ...result, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося зберегти реакцію";
    return {
      success: false as const,
      myReaction: null,
      likes: 0,
      dislikes: 0,
      error: message,
    };
  }
}
