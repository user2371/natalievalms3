import {
  AdminReportIdInput,
  AdminReportIdSchema,
  BlockStatus,
  BlockUserInput,
  BlockUserSchema,
  GetBlockStatusInput,
  GetBlockStatusSchema,
  ListMessagesInput,
  ListMessagesSchema,
  MarkConversationReadInput,
  MarkConversationReadSchema,
  ReportMessageInput,
  ReportMessageSchema,
  ReportReviewData,
  SendMessageInput,
  SendMessageSchema,
  StartConversationInput,
  StartConversationSchema,
  UnblockUserInput,
  UnblockUserSchema,
} from "./schema";
import * as repository from "./repository";
import { isMessageRateLimited, recordMessageSent } from "@/lib/messages/rateLimit";

/**
 * `modules/messages/service.ts` — ФАЗА MSG+, задача MSG+.1.2 (03.09.2026).
 * Бізнес-логіка та валідація поверх `repository.ts`, той самий поділ, що
 * й у `modules/comments/service.ts`.
 *
 * `assertParticipant` — той самий принцип подвійної перевірки "не тільки
 * в UI" (`CLAUDE.md`), що вже `assertCourseAccessService`
 * (`modules/access/service.ts`): UI (MSG+.3, ще не реалізовано) показує
 * лише розмови користувача, але кожна дія тут ЗАНОВО перевіряє
 * членство — захист від прямого виклику server action з чужим
 * `conversationId`.
 */
async function assertParticipant(conversationId: string, userId: string): Promise<void> {
  const participant = await repository.findParticipant(conversationId, userId);
  if (!participant) {
    throw new Error("Доступ заборонено: ви не учасник цієї розмови");
  }
}

/**
 * MSG+.4.1 (04.09.2026) — рішення "блокування діє в обидва боки": якщо
 * ХТОСЬ ОДИН із пари заблокував іншого, розмова "мовчить" для обох
 * (`repository.findBlockBetween` перевіряє напрямок в обидва боки),
 * незалежно від того, хто саме зараз намагається написати. Той самий
 * принцип подвійної перевірки, що вже `assertParticipant` — застосовано
 * і в `startConversationService`, і в `sendMessageService`, не лише в
 * UI (кнопка "Заблокувати" в шапці розмови ховає поле вводу, але це не
 * єдиний захист).
 */
async function assertNotBlocked(userAId: string, userBId: string): Promise<void> {
  const blocked = await repository.findBlockBetween(userAId, userBId);
  if (blocked) {
    throw new Error("Спілкування з цим користувачем недоступне");
  }
}

export async function listConversationsService(userId: string) {
  return repository.listConversationsForUser(userId);
}

/**
 * Знаходить наявну розмову з `recipientId` або створює нову
 * (`findOrCreateConversation`, MSG+.0.1) — повертає лише `conversationId`,
 * без повідомлень (UI сам довантажить історію через `listMessagesService`
 * після переходу в розмову).
 */
export async function startConversationService(
  userId: string,
  input: StartConversationInput,
): Promise<string> {
  const parsed = StartConversationSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
  }

  const { recipientId } = parsed.data;

  if (recipientId === userId) {
    throw new Error("Не можна писати повідомлення самому собі");
  }

  const recipientExists = await repository.findUserId(recipientId);
  if (!recipientExists) {
    throw new Error("Користувача не знайдено");
  }

  await assertNotBlocked(userId, recipientId);

  const existing = await repository.findConversationBetween(userId, recipientId);
  if (existing) {
    return existing;
  }

  return repository.createConversation(userId, recipientId);
}

export async function sendMessageService(userId: string, input: SendMessageInput) {
  const parsed = SendMessageSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані повідомлення");
  }

  await assertParticipant(parsed.data.conversationId, userId);

  // MSG+.4.3 (04.09.2026) — перевіряється ПІСЛЯ `assertParticipant` (не
  // раніше): немає сенсу тратити rate-limit-слот на запит, який однаково
  // впаде через відсутність членства.
  if (isMessageRateLimited(userId)) {
    throw new Error("Забагато повідомлень поспіль. Зачекайте трохи й спробуйте ще раз.");
  }

  // MSG+.4.1 — учасники розмови вже завантажені у `findParticipant` вище
  // лише частково (лише запис поточного юзера, не другого учасника),
  // тому для перевірки блокування шукаємо другого учасника окремо —
  // `listConversationsForUser` тут не підходить (то список УСІХ розмов
  // юзера, зайве навантаження заради одного `otherParticipant`).
  const participants = await repository.listParticipantsForConversation(parsed.data.conversationId);
  const other = participants.find((p) => p.id !== userId);
  if (other) {
    await assertNotBlocked(userId, other.id);
  }

  const message = await repository.createMessage({
    conversationId: parsed.data.conversationId,
    senderId: userId,
    body: parsed.data.body,
  });
  recordMessageSent(userId);
  return message;
}

export async function listMessagesService(userId: string, input: ListMessagesInput) {
  const parsed = ListMessagesSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
  }

  await assertParticipant(parsed.data.conversationId, userId);

  return repository.listMessages(parsed.data.conversationId, {
    cursor: parsed.data.cursor ?? null,
    limit: parsed.data.limit ?? 30,
  });
}

export async function markConversationReadService(
  userId: string,
  input: MarkConversationReadInput,
): Promise<void> {
  const parsed = MarkConversationReadSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
  }

  await assertParticipant(parsed.data.conversationId, userId);

  await repository.markConversationRead(parsed.data.conversationId, userId);
}

/** Хто виконує дію — приходить із сесії (`actions.ts`), той самий підхід, що `RoleChangeActor` у `modules/users/service.ts`. */
export interface MessageActor {
  userId: string;
  name: string;
  email: string;
}

function formatActorLabel(actor: { name: string; email: string }): string {
  const name = actor.name.trim();
  if (name && actor.email) return `${name} (${actor.email})`;
  return name || actor.email || "Невідомий користувач";
}

/** Знімок автора повідомлення на момент скарги (MSG+.4.1) — за живими даними `sender`, якщо акаунт ще існує, інакше вже наявний `senderLabel` (F.24, MSG+.5.1) — той самий фолбек-принцип, що вже описаний докблоком над `Message.senderLabel` у Prisma-схемі. */
function formatMessageSenderLabel(message: repository.MessageForReport): string {
  if (!message.sender) {
    return message.senderLabel ?? "Видалений користувач";
  }
  const name =
    message.sender.nickname ||
    `${message.sender.firstName}${message.sender.lastName ? ` ${message.sender.lastName}` : ""}`;
  return formatActorLabel({ name, email: message.sender.email });
}

/**
 * MSG+.4.1 (04.09.2026) — блокує `input.userId`: `assertParticipant`
 * тут НЕ підходить (блокування можливе й до першої розмови, напр. з
 * профілю `/users/[id]`, де розмови між юзерами ще нема) — єдина
 * перевірка тут: не можна заблокувати самого себе.
 */
export async function blockUserService(actor: MessageActor, input: BlockUserInput): Promise<void> {
  const parsed = BlockUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
  }
  if (parsed.data.userId === actor.userId) {
    throw new Error("Не можна заблокувати самого себе");
  }
  await repository.createBlock(actor.userId, parsed.data.userId);
}

export async function unblockUserService(actor: MessageActor, input: UnblockUserInput): Promise<void> {
  const parsed = UnblockUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
  }
  await repository.deleteBlock(actor.userId, parsed.data.userId);
}

export async function getBlockStatusService(
  actor: MessageActor,
  input: GetBlockStatusInput,
): Promise<BlockStatus> {
  const parsed = GetBlockStatusSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
  }
  const [blockedByMe, blockingMe] = await Promise.all([
    repository.findBlockDirection(actor.userId, parsed.data.userId),
    repository.findBlockDirection(parsed.data.userId, actor.userId),
  ]);
  return { blockedByMe, blockingMe };
}

/**
 * MSG+.4.1 — кнопка "поскаржитись" на чужому повідомленні:
 * `assertParticipant` (скаржитись можна лише в межах розмови, де сам є
 * учасником — той самий подвійний захист, що всюди в модулі), заборона
 * скаржитись на ВЛАСНЕ повідомлення, знімок тексту й автора беруться в
 * МОМЕНТ скарги (докблок над `MessageReport` у Prisma-схемі).
 */
export async function reportMessageService(actor: MessageActor, input: ReportMessageInput) {
  const parsed = ReportMessageSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані скарги");
  }

  const message = await repository.findMessageForReport(parsed.data.messageId);
  if (!message) {
    throw new Error("Повідомлення не знайдено");
  }

  await assertParticipant(message.conversationId, actor.userId);

  if (message.senderId === actor.userId) {
    throw new Error("Не можна поскаржитись на власне повідомлення");
  }

  return repository.createMessageReport({
    messageId: message.id,
    conversationId: message.conversationId,
    reporterId: actor.userId,
    reporterLabel: formatActorLabel(actor),
    reason: parsed.data.reason,
    messageBodySnapshot: message.body,
    messageSenderLabel: formatMessageSenderLabel(message),
  });
}

// --- MSG+.4.2 (04.09.2026) — адмін-черга репортів. `assertAdmin` тут не
// потрібна — межа "ADMIN чи ні" вже перевірена в `actions.ts`
// (`requireAdmin`, той самий підхід, що вже `modules/users/actions.ts`),
// сервіс лише виконує саму логіку.

export async function listMessageReportsService() {
  return repository.listMessageReports();
}

/**
 * Перегляд конкретного репорту адміном — САМ ЦЕЙ ВИКЛИК і є момент,
 * коли адмін бачить приватну переписку (рішення MSG+.4.2: доступ лише
 * через конкретний репорт, не "вся розмова про всяк випадок"), тому тут
 * же пишеться рядок аудит-сліду (`createModerationLog`) ПЕРЕД
 * поверненням повідомлень — навіть якщо адмін після цього закриє
 * вкладку, не дочитавши, факт перегляду вже зафіксовано.
 */
export async function reviewReportService(
  admin: MessageActor,
  input: AdminReportIdInput,
): Promise<ReportReviewData> {
  const parsed = AdminReportIdSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
  }

  const report = await repository.findMessageReportById(parsed.data.reportId);
  if (!report) {
    throw new Error("Скаргу не знайдено");
  }

  await repository.createModerationLog({
    conversationId: report.conversationId,
    messageReportId: report.id,
    adminId: admin.userId,
    adminLabel: formatActorLabel(admin),
  });

  const [logs, { messages }, otherParticipants] = await Promise.all([
    repository.listModerationLogsForReport(report.id),
    repository.listMessages(report.conversationId, { cursor: null, limit: 100 }),
    repository.listParticipantsForConversation(report.conversationId),
  ]);

  return {
    report,
    logs,
    // `listMessages` віддає найновіші першими (DESC) — розвертаємо в
    // хронологічний порядок, той самий підхід, що вже
    // `app/messages/[conversationId]/page.tsx`.
    messages: [...messages].reverse(),
    otherParticipants,
  };
}

export async function markReportReviewedService(input: AdminReportIdInput): Promise<void> {
  const parsed = AdminReportIdSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані");
  }
  const report = await repository.findMessageReportById(parsed.data.reportId);
  if (!report) {
    throw new Error("Скаргу не знайдено");
  }
  await repository.markMessageReportReviewed(parsed.data.reportId);
}
