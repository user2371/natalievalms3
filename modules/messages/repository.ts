import { prisma } from "@/lib/prisma";
import type {
  ConversationListItem,
  ListMessagesResult,
  Message,
  MessageParticipant,
  MessageReportListItem,
  ModerationLogEntry,
} from "./schema";

/**
 * `modules/messages/repository.ts` — ФАЗА MSG+, задача MSG+.1.1 (03.09.2026).
 * Лише прямі запити до Prisma, без бізнес-логіки (валідація довжини/
 * учасництва — у `service.ts`), той самий поділ, що й у
 * `modules/comments/repository.ts`.
 */

const PARTICIPANT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  nickname: true,
  avatarUrl: true,
} as const;

function mapMessage(raw: {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderLabel: string | null;
  body: string;
  createdAt: Date;
  sender: MessageParticipant | null;
}): Message {
  return {
    id: raw.id,
    conversationId: raw.conversationId,
    senderId: raw.senderId,
    senderLabel: raw.senderLabel,
    body: raw.body,
    createdAt: raw.createdAt,
    sender: raw.sender,
  };
}

/** `id` існуючого юзера чи `null` — перевірка перед стартом розмови (`startConversationService`, щоб не створити розмову з неіснуючим `recipientId`). */
export async function findUserId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return user?.id ?? null;
}

/**
 * Розмова між рівно цими двома юзерами (MVP обмежує 2 учасники на
 * рівні сервіса, MSG+.0.1) чи `null`, якщо такої ще немає.
 *
 * ВІДОМЕ ОБМЕЖЕННЯ: перевірка "чи існує" і подальше створення — не
 * атомарні (два `await`, не одна транзакція з блокуванням). Теоретична
 * гонка при ОДНОЧАСНОМУ першому повідомленні від обох юзерів одне
 * одному може створити дві розмови замість перевикористання однієї.
 * Для MVP-масштабу (навчальна платформа, не месенджер з мільйонами
 * одночасних юзерів) визнано прийнятним ризиком — той самий рівень
 * прагматизму, що вже в `lib/comments/rateLimit.ts` (in-memory,
 * "не підходить для мультиінстансного/serverless деплою... виходить
 * за межі MVP"). Гартування (advisory lock чи унікальний `pairKey` на
 * `Conversation`) — за потреби, окремою задачею.
 */
export async function findConversationBetween(userAId: string, userBId: string): Promise<string | null> {
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: userAId } } },
        { participants: { some: { userId: userBId } } },
      ],
    },
    select: { id: true },
  });
  return existing?.id ?? null;
}

export async function createConversation(userAId: string, userBId: string): Promise<string> {
  const created = await prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId: userAId }, { userId: userBId }],
      },
    },
    select: { id: true },
  });
  return created.id;
}

/** Запис членства (для перевірки "поточна сесія — учасник цієї розмови" в `service.ts`, MSG+.1.2) чи `null`. */
export async function findParticipant(conversationId: string, userId: string) {
  return prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
}

/**
 * Список розмов користувача — з даними другого учасника, останнім
 * повідомленням і лічильником непрочитаних. N+1 на лічильник непрочитаних
 * (один `count`-запит на розмову, паралельно через `Promise.all`) —
 * прийнятно для очікуваної кількості розмов одного юзера на MVP-масштабі
 * (навчальна платформа), той самий рівень прагматизму, що й
 * `findConversationBetween` вище.
 */
export async function listConversationsForUser(userId: string): Promise<ConversationListItem[]> {
  const participations = await prisma.conversationParticipant.findMany({
    where: { userId },
    select: {
      conversationId: true,
      lastReadAt: true,
      conversation: {
        select: {
          id: true,
          createdAt: true,
          participants: {
            where: { userId: { not: userId } },
            select: { user: { select: PARTICIPANT_SELECT } },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, senderId: true },
          },
        },
      },
    },
  });

  const items = await Promise.all(
    participations.map(async (participation) => {
      const { conversation } = participation;
      const lastMessage = conversation.messages[0] ?? null;

      // `NULL` (видалений автор, `senderId` — `SetNull`, MSG+.0.4) НЕ
      // рахується "моїм" повідомленням у `NOT senderId = userId` (в SQL
      // `NULL = x` — `UNKNOWN`, рядок випадає з `WHERE`), тому явно
      // додаємо `senderId: null` в `OR` — інакше повідомлення видалених
      // юзерів ніколи не рахувалися б як непрочитані.
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: participation.conversationId,
          createdAt: { gt: participation.lastReadAt ?? new Date(0) },
          OR: [{ senderId: { not: userId } }, { senderId: null }],
        },
      });

      return {
        id: conversation.id,
        createdAt: conversation.createdAt,
        otherParticipant: conversation.participants[0]?.user ?? null,
        lastMessage,
        unreadCount,
      } satisfies ConversationListItem;
    }),
  );

  // Найактивніші розмови зверху — за часом останнього повідомлення, а не
  // за `createdAt` самої розмови (щойно створена без повідомлень ще
  // розмова, MSG+.3 "кнопка Написати", лишається внизу списку до першого
  // повідомлення).
  items.sort((a, b) => {
    const aTime = (a.lastMessage?.createdAt ?? a.createdAt).getTime();
    const bTime = (b.lastMessage?.createdAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  return items;
}

export interface ListMessagesOptions {
  cursor: string | null;
  limit: number;
}

/** Історія повідомлень розмови, найновіші спершу, курсорна пагінація по `id` (MSG+.1.1). */
export async function listMessages(
  conversationId: string,
  options: ListMessagesOptions,
): Promise<ListMessagesResult> {
  const rows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: options.limit + 1,
    ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    include: { sender: { select: PARTICIPANT_SELECT } },
  });

  const hasMore = rows.length > options.limit;
  const page = hasMore ? rows.slice(0, options.limit) : rows;

  return {
    messages: page.map(mapMessage),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  };
}

export interface CreateMessageData {
  conversationId: string;
  senderId: string;
  body: string;
}

export async function createMessage(data: CreateMessageData): Promise<Message> {
  const row = await prisma.message.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      body: data.body,
    },
    include: { sender: { select: PARTICIPANT_SELECT } },
  });

  return mapMessage(row);
}

export async function markConversationRead(conversationId: string, userId: string): Promise<void> {
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}

/**
 * MSG+.4.1 (04.09.2026) — чи існує блокування МІЖ цими двома юзерами, в
 * БУДЬ-ЯКОМУ напрямку (`OR` двох умов на `UserBlock.@@unique([blockerId,
 * blockedId])`) — використовується `assertNotBlocked` (`service.ts`)
 * перед стартом розмови/надсиланням: якщо хтось один заблокував іншого,
 * спілкування "мовчить" для обох сторін, не лише для того, хто
 * заблокував.
 */
export async function findBlockBetween(userAId: string, userBId: string): Promise<boolean> {
  const block = await prisma.userBlock.findFirst({
    where: {
      OR: [
        { blockerId: userAId, blockedId: userBId },
        { blockerId: userBId, blockedId: userAId },
      ],
    },
    select: { id: true },
  });
  return block !== null;
}

/** Чи `blockerId` конкретно заблокував `blockedId` (напрямок важливий — для тексту кнопки "Заблокувати"/"Розблокувати" в `getBlockStatusService`). */
export async function findBlockDirection(blockerId: string, blockedId: string): Promise<boolean> {
  const block = await prisma.userBlock.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { id: true },
  });
  return block !== null;
}

export async function createBlock(blockerId: string, blockedId: string): Promise<void> {
  // `upsert` — той самий захист від дубліката повторного натискання
  // "Заблокувати", що вже `@@unique([blockerId, blockedId])` дав би як
  // constraint-помилку; тут просто нема сенсу створювати другий рядок.
  await prisma.userBlock.upsert({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    create: { blockerId, blockedId },
    update: {},
  });
}

export async function deleteBlock(blockerId: string, blockedId: string): Promise<void> {
  await prisma.userBlock.deleteMany({ where: { blockerId, blockedId } });
}

export interface MessageForReport {
  id: string;
  conversationId: string;
  body: string;
  senderId: string | null;
  senderLabel: string | null;
  sender: { firstName: string; lastName: string | null; nickname: string | null; email: string } | null;
}

/** Повідомлення для побудови знімку скарги (`reportMessageService`) — потрібне `conversationId` (для `assertParticipant`) і живі дані відправника (знімок формується в момент скарги, а не береться з уже застарілого `senderLabel`, якщо автор ще не видалив акаунт; `email` — лише тут, не в `PARTICIPANT_SELECT`, бо потрібен саме адмін-черзі для ідентифікації, а не звичайному UI розмови). */
export async function findMessageForReport(messageId: string): Promise<MessageForReport | null> {
  return prisma.message.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      conversationId: true,
      body: true,
      senderId: true,
      senderLabel: true,
      sender: { select: { firstName: true, lastName: true, nickname: true, email: true } },
    },
  });
}

export interface CreateMessageReportData {
  messageId: string;
  conversationId: string;
  reporterId: string;
  reporterLabel: string;
  reason: string;
  messageBodySnapshot: string;
  messageSenderLabel: string;
}

function mapReport(raw: {
  id: string;
  messageId: string;
  conversationId: string;
  reporterLabel: string;
  reason: string;
  messageBodySnapshot: string;
  messageSenderLabel: string;
  status: string;
  createdAt: Date;
}): MessageReportListItem {
  return {
    id: raw.id,
    messageId: raw.messageId,
    conversationId: raw.conversationId,
    reporterLabel: raw.reporterLabel,
    reason: raw.reason,
    messageBodySnapshot: raw.messageBodySnapshot,
    messageSenderLabel: raw.messageSenderLabel,
    // `status` у БД — вільний `String` (той самий підхід, що `User.role`,
    // без Prisma enum), звужуємо до літерального union тут, на межі
    // репозиторію — той самий принцип, що вже `mapMessage` вище.
    status: raw.status === "REVIEWED" ? "REVIEWED" : "PENDING",
    createdAt: raw.createdAt,
  };
}

export async function createMessageReport(data: CreateMessageReportData): Promise<MessageReportListItem> {
  const row = await prisma.messageReport.create({ data });
  return mapReport(row);
}

/** Адмін-черга (MSG+.4.2) — непереглянуті зверху (найстаріші спершу — черга, не стрічка), переглянуті після них. */
export async function listMessageReports(): Promise<MessageReportListItem[]> {
  const rows = await prisma.messageReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
  });
  return rows.map(mapReport);
}

export async function findMessageReportById(reportId: string): Promise<MessageReportListItem | null> {
  const row = await prisma.messageReport.findUnique({ where: { id: reportId } });
  return row ? mapReport(row) : null;
}

export async function markMessageReportReviewed(reportId: string): Promise<void> {
  await prisma.messageReport.update({ where: { id: reportId }, data: { status: "REVIEWED" } });
}

export interface CreateModerationLogData {
  conversationId: string;
  messageReportId: string;
  adminId: string;
  adminLabel: string;
}

export async function createModerationLog(data: CreateModerationLogData): Promise<void> {
  await prisma.conversationModerationLog.create({ data });
}

/** Історія переглядів конкретного репорту (MSG+.4.2), найновіші зверху — хто й коли вже дивився цю скаргу. */
export async function listModerationLogsForReport(reportId: string): Promise<ModerationLogEntry[]> {
  const rows = await prisma.conversationModerationLog.findMany({
    where: { messageReportId: reportId },
    orderBy: { viewedAt: "desc" },
    select: { id: true, adminLabel: true, viewedAt: true },
  });
  return rows;
}

/**
 * MSG+.5.1 (04.09.2026) — інтеграція з реальним видаленням акаунта
 * (F.24, `modules/account/service.ts`). Викликається ПЕРЕД
 * `prisma.user.delete` (`modules/account/repository.ts`): проставляє
 * текстовий знімок `senderLabel` на ВСІХ повідомленнях, які цей юзер
 * надіслав (`senderId = userId`, ще живий у момент виклику), щоб
 * повідомлення лишились читабельними після того, як каскадний `onDelete:
 * SetNull` (MSG+.0.4) обнулить `senderId`. Не чіпає `MessageReport`:
 * `reporterLabel` там і так уже текстовий знімок, заповнений у момент
 * подання скарги (`createMessageReport`), а не жива посилка на
 * `reporterId` — оновлювати вже нема чого. Так само не чіпає
 * `UserBlock`/`ConversationParticipant` — обидва каскадно
 * видаляються самою Prisma-схемою (`onDelete: Cascade`), для них не
 * потрібен текстовий знімок (запис членства/блокування, не вміст
 * переписки).
 */
export async function anonymizeSenderForDeletedUser(userId: string, label: string): Promise<void> {
  await prisma.message.updateMany({
    where: { senderId: userId },
    data: { senderLabel: label },
  });
}

/** MSG+.4.2 — обидва учасники розмови (не "хто не є мною", як `listConversationsForUser` — адмін не учасник, тому симетричний список для шапки `app/admin/reports/[reportId]`). */
export async function listParticipantsForConversation(conversationId: string): Promise<MessageParticipant[]> {
  const rows: { user: MessageParticipant }[] = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { user: { select: PARTICIPANT_SELECT } },
  });
  return rows.map((r) => r.user);
}
