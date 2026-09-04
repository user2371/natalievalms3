"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  AdminReportIdInput,
  BlockUserInput,
  GetBlockStatusInput,
  ListMessagesInput,
  MarkConversationReadInput,
  ReportMessageInput,
  SendMessageInput,
  StartConversationInput,
  UnblockUserInput,
} from "./schema";
import * as service from "./service";

/**
 * `modules/messages/actions.ts` — ФАЗА MSG+, задача MSG+.1.3 (03.09.2026).
 * Next.js server actions, викликають лише `service.ts`, той самий поділ,
 * що й у `modules/comments/actions.ts`. `userId` завжди з сесії (`auth()`),
 * ніколи з клієнта — той самий принцип, що й `addCommentAction`.
 *
 * `revalidatePath("/messages", "page")` — типізована форма (той самий
 * шаблон, що вже виправлено в `modules/comments/actions.ts` для
 * `/courses/[slug]/lessons/[lessonId]`): раніше тут стояв коментар, що
 * маршрут `/messages` ще не існує (UI — MSG+.3) і типізована форма поки
 * не застосовна — тепер, коли `app/messages/page.tsx` (MSG+.3.1) реально
 * існує, використано одразу правильний варіант, без проміжного
 * нетипізованого виклику. `/messages/[conversationId]` (сама розмова) —
 * НЕ ревалідується тут: цей екран — клієнтський компонент, що сам
 * довантажує історію через `listMessagesAction` при кожному відкритті,
 * ревалідація Next.js-кешу на нього не впливає.
 */

/**
 * `startConversation` — знаходить чи створює розмову з `recipientId`
 * (напр. з кнопки "Написати" на профілі користувача `/users/[id]`,
 * MSG+.3.3). Повертає лише `conversationId` — UI сам переходить у
 * розмову й довантажує історію окремим викликом `listMessages`.
 */
export async function startConversationAction(input: StartConversationInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб написати повідомлення");
    }

    const conversationId = await service.startConversationService(userId, input);
    return { success: true as const, conversationId, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося почати розмову";
    return { success: false as const, conversationId: null, error: message };
  }
}

/**
 * `sendMessage` — авторизація подвійна: тут (сесія обов'язкова) і в
 * `service.sendMessageService` → `assertParticipant` (поточна сесія має
 * бути учасником саме цієї `conversationId`). Realtime-сповіщення
 * співрозмовника (MSG+.2, окрема наступна задача) підключається пізніше
 * — сюди ж, після успішного `service.sendMessageService`.
 */
export async function sendMessageAction(input: SendMessageInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб написати повідомлення");
    }

    const message = await service.sendMessageService(userId, input);
    revalidatePath("/messages", "page");
    return { success: true as const, message, error: null };
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : "Не вдалося надіслати повідомлення";
    return { success: false as const, message: null, error: errMessage };
  }
}

/** `listMessages` — історія конкретної розмови, курсорна пагінація (MSG+.1.1). */
export async function listMessagesAction(input: ListMessagesInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб переглянути повідомлення");
    }

    const result = await service.listMessagesService(userId, input);
    return { success: true as const, ...result, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося завантажити повідомлення";
    return { success: false as const, messages: [], nextCursor: null, error: message };
  }
}

/** `listConversations` — список розмов поточного користувача, для сторінки `/messages` (MSG+.3.1). */
export async function listConversationsAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб переглянути повідомлення");
    }

    const conversations = await service.listConversationsService(userId);
    return { success: true as const, conversations, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося завантажити розмови";
    return { success: false as const, conversations: [], error: message };
  }
}

/** `markRead` — оновлює курсор прочитаного поточного користувача (`ConversationParticipant.lastReadAt`, MSG+.0.1). */
export async function markConversationReadAction(input: MarkConversationReadInput) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти");
    }

    await service.markConversationReadService(userId, input);
    revalidatePath("/messages", "page");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося позначити прочитаним";
    return { success: false as const, error: message };
  }
}

/**
 * MSG+.4.1 (04.09.2026) — `session.user` тут потрібен НЕ лише `id`
 * (як у діях вище), а й `name`/`email` для текстового знімку
 * (`reporterLabel`/`senderLabel`-подібні поля) — той самий набір, що
 * `RoleChangeActor` формує в `modules/users/actions.ts`, лише свій
 * локальний хелпер тут (модулі не діляться внутрішніми типами
 * `service.ts` одне з одним, той самий принцип, що вже "кожен модуль —
 * власний `actions.ts`/`service.ts`").
 */
async function requireActor(): Promise<service.MessageActor> {
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; email?: string } | undefined;
  if (!user?.id) {
    throw new Error("Потрібно увійти");
  }
  return { userId: user.id, name: user.name ?? "", email: user.email ?? "" };
}

/** `blockUser` — блокує іншого користувача (MSG+.4.1); ревалідує `/messages`, бо стан блокування впливає на можливість писати в наявній розмові. */
export async function blockUserAction(input: BlockUserInput) {
  try {
    const actor = await requireActor();
    await service.blockUserService(actor, input);
    revalidatePath("/messages", "page");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося заблокувати користувача";
    return { success: false as const, error: message };
  }
}

export async function unblockUserAction(input: UnblockUserInput) {
  try {
    const actor = await requireActor();
    await service.unblockUserService(actor, input);
    revalidatePath("/messages", "page");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося розблокувати користувача";
    return { success: false as const, error: message };
  }
}

/** `getBlockStatus` — стан блокування між поточним юзером і співрозмовником, для шапки екрана розмови (MSG+.4.1). */
export async function getBlockStatusAction(input: GetBlockStatusInput) {
  try {
    const actor = await requireActor();
    const status = await service.getBlockStatusService(actor, input);
    return { success: true as const, status, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося перевірити статус блокування";
    return {
      success: false as const,
      status: { blockedByMe: false, blockingMe: false },
      error: message,
    };
  }
}

/** `reportMessage` — кнопка "поскаржитись" на чужому повідомленні (MSG+.4.1). */
export async function reportMessageAction(input: ReportMessageInput) {
  try {
    const actor = await requireActor();
    await service.reportMessageService(actor, input);
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося надіслати скаргу";
    return { success: false as const, error: message };
  }
}

/**
 * MSG+.4.2 (04.09.2026) — той самий `requireAdmin`-патерн, що вже
 * `modules/users/actions.ts` (перевірка ролі з сесії + повернення даних
 * актора для аудиту, тут — `adminLabel` у
 * `ConversationModerationLog`).
 */
async function requireAdmin(): Promise<service.MessageActor> {
  const session = await auth();
  const user = session?.user as
    | { id?: string; role?: string; name?: string; email?: string }
    | undefined;
  if (user?.role !== "ADMIN" || !user.id) {
    throw new Error("Доступ заборонено: потрібна роль адміністратора");
  }
  return { userId: user.id, name: user.name ?? "", email: user.email ?? "" };
}

/** `listMessageReports` — адмін-черга скарг (`/admin/reports`, MSG+.4.2). */
export async function listMessageReportsAction() {
  try {
    await requireAdmin();
    const reports = await service.listMessageReportsService();
    return { success: true as const, reports, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося завантажити скарги";
    return { success: false as const, reports: [], error: message };
  }
}

/**
 * `reviewReport` — відкриває конкретний репорт (`/admin/reports/[reportId]`,
 * MSG+.4.2). ВАЖЛИВО: сам виклик пише рядок аудит-сліду перегляду
 * (`service.reviewReportService`) — це навмисно server action, що
 * ЗАВЖДИ фактично відкриває приватну переписку, а не просто рендерить
 * сторінку; повторний виклик (напр. оновлення сторінки) додає ще один
 * рядок логу — так і задумано (кожен перегляд, а не лише перший).
 */
export async function reviewReportAction(input: AdminReportIdInput) {
  try {
    const admin = await requireAdmin();
    const data = await service.reviewReportService(admin, input);
    return { success: true as const, data, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося відкрити скаргу";
    return { success: false as const, data: null, error: message };
  }
}

/** `markReportReviewed` — позначає скаргу розглянутою (MSG+.4.2). */
export async function markReportReviewedAction(input: AdminReportIdInput) {
  try {
    await requireAdmin();
    await service.markReportReviewedService(input);
    revalidatePath("/admin/reports", "page");
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося позначити скаргу розглянутою";
    return { success: false as const, error: message };
  }
}
