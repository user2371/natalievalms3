import { z } from "zod";

/**
 * `modules/messages/schema.ts` — ФАЗА MSG+, задача MSG+.1.1 (03.09.2026,
 * за прямим проханням користувача — "бери MSG+.1 і реалізуй"). Той самий
 * підхід, що й у `modules/comments/schema.ts`: Zod-схеми для вхідних
 * даних server actions + окремі TS-інтерфейси для форми, яку повертають
 * `repository`/`service` (дзеркалять Prisma-моделі `Conversation`/
 * `ConversationParticipant`/`Message` з MSG+.0, з уже підвантаженими
 * даними співрозмовника й порахованим лічильником непрочитаних).
 */

export const StartConversationSchema = z.object({
  recipientId: z.string().min(1, "Не вказано отримувача"),
});

/**
 * MSG+.7.8 (07.09.2026, за прямим проханням користувача) — `body` більше
 * НЕ вимагає `.min(1)` на рівні самого поля: повідомлення-лише-з-
 * зображенням (`imageUrl` заповнений, текст порожній) — так само
 * валідне, як і повідомлення-лише-з-текстом. Замість цього — `.refine`
 * нижче на рівні всього об'єкта: непорожнім має бути РІВНО ОДНЕ з двох
 * (текст АБО зображення), не саме `body`. `imageUrl` тут — вже готовий
 * Cloudinary URL з попереднього виклику `uploadMessageImageAction`
 * (двоетапний флоу, той самий підхід, що вже `Article`/ДЗ-редактор:
 * зображення завантажується ОКРЕМО від збереження тексту), а не сам
 * файл — цю схему валідує сам `sendMessageAction`, файл вже пройшов
 * `UploadMessageImageSchema`/`uploadService.ts` раніше.
 */
export const SendMessageSchema = z
  .object({
    conversationId: z.string().min(1, "Не вказано розмову"),
    body: z.string().trim().max(4000, "Повідомлення занадто довге (максимум 4000 символів)"),
    imageUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => data.body.length > 0 || !!data.imageUrl, {
    message: "Повідомлення не може бути порожнім",
    path: ["body"],
  });

/** MSG+.7.8 — завантаження зображення, яке користувач прикріплює до повідомлення, ПЕРЕД самим надсиланням (той самий двоетапний флоу, що вже `uploadHomeworkImageAction`). */
export const UploadMessageImageSchema = z.object({
  conversationId: z.string().min(1, "Не вказано розмову"),
});

/**
 * Ліміти для зображення-вкладення в повідомленні — той самий підхід
 * (окрема константа на модуль), що `HOMEWORK_IMAGE_MAX_SIZE_BYTES`/
 * `CERTIFICATE_MAX_SIZE_BYTES`. 5MB — той самий ліміт, що аватарка
 * (контент у бульбашці чату, не повнорозмірний документ).
 */
export const MESSAGE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const MESSAGE_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ListMessagesSchema = z.object({
  conversationId: z.string().min(1, "Не вказано розмову"),
  // Курсор пагінації — `id` повідомлення, з якого продовжити "довантажити
  // старіші" (не offset — історія розмови може вирости, той самий принцип,
  // що задокументований у MSG+.0.3 для індексу `Message(conversationId,
  // createdAt)`). `.nullable()` — щоб клієнт міг явно передати `null` для
  // першої сторінки.
  cursor: z.string().min(1).nullable().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const MarkConversationReadSchema = z.object({
  conversationId: z.string().min(1, "Не вказано розмову"),
});

/**
 * MSG+.4.1 (04.09.2026) — блокування/розблокування конкретного
 * `userId` (не `conversationId`): блокування діє на РІВЕНЬ пари
 * користувачів, а не конкретної розмови — узгоджено з
 * `findConversationBetween`/`UserBlock`-унікальністю в схемі, той самий
 * принцип, що вже `StartConversationSchema.recipientId`.
 */
export const BlockUserSchema = z.object({
  userId: z.string().min(1, "Не вказано користувача"),
});
export const UnblockUserSchema = z.object({
  userId: z.string().min(1, "Не вказано користувача"),
});
export const GetBlockStatusSchema = z.object({
  userId: z.string().min(1, "Не вказано користувача"),
});

/** MSG+.4.1 — кнопка "поскаржитись" на чужому повідомленні. */
export const ReportMessageSchema = z.object({
  messageId: z.string().min(1, "Не вказано повідомлення"),
  reason: z
    .string()
    .trim()
    .min(1, "Вкажіть причину скарги")
    .max(500, "Причина занадто довга (максимум 500 символів)"),
});

/** MSG+.4.2 — адмінська дія над конкретним репортом (перегляд/позначення). */
export const AdminReportIdSchema = z.object({
  reportId: z.string().min(1, "Не вказано скаргу"),
});

export type StartConversationInput = z.infer<typeof StartConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type UploadMessageImageInput = z.infer<typeof UploadMessageImageSchema>;
export type ListMessagesInput = z.infer<typeof ListMessagesSchema>;
export type MarkConversationReadInput = z.infer<typeof MarkConversationReadSchema>;
export type BlockUserInput = z.infer<typeof BlockUserSchema>;
export type UnblockUserInput = z.infer<typeof UnblockUserSchema>;
export type GetBlockStatusInput = z.infer<typeof GetBlockStatusSchema>;
export type ReportMessageInput = z.infer<typeof ReportMessageSchema>;
export type AdminReportIdInput = z.infer<typeof AdminReportIdSchema>;

/** MSG+.4.1 — стан блокування між поточним юзером і `userId` з `GetBlockStatusInput`, для UI (напис кнопки/банер "спілкування недоступне"). */
export interface BlockStatus {
  /** Поточний юзер заблокував співрозмовника. */
  blockedByMe: boolean;
  /** Співрозмовник заблокував поточного юзера. */
  blockingMe: boolean;
}

/** MSG+.4.1/.4.2 — один пункт адмін-черги репортів (`app/admin/reports`). Знімки тексту/автора — на момент скарги, не живі дані (докблок над `MessageReport` у Prisma-схемі). */
export interface MessageReportListItem {
  id: string;
  messageId: string;
  conversationId: string;
  reporterLabel: string;
  reason: string;
  messageBodySnapshot: string;
  messageSenderLabel: string;
  status: "PENDING" | "REVIEWED";
  createdAt: Date;
}

/** MSG+.4.2 — один рядок аудит-сліду перегляду репортнутої розмови адміном. */
export interface ModerationLogEntry {
  id: string;
  adminLabel: string;
  viewedAt: Date;
}

/** MSG+.4.2 — повна картка репорту для `app/admin/reports/[reportId]`: сам репорт + історія переглядів + повідомлення розмови (лише завантажені через адмінський шлях перегляду). */
export interface ReportReviewData {
  report: MessageReportListItem;
  logs: ModerationLogEntry[];
  messages: Message[];
  otherParticipants: MessageParticipant[];
}

/** Учасник розмови — лише поля, потрібні для відображення (не весь `User`), той самий підхід, що й `CommentAuthor`. */
export interface MessageParticipant {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
}

/**
 * Форма повідомлення, яку повертає `repository`/`service` (дзеркалить
 * модель Prisma `Message`, MSG+.0.2). `sender` — `null`, коли автор
 * видалив акаунт (F.24) і `senderId` став `NULL` (`onDelete: SetNull`,
 * MSG+.5.1) — UI показує `senderLabel` замість даних живого `User`.
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderLabel: string | null;
  body: string;
  /** MSG+.7.8 — Cloudinary URL вкладеного зображення, `null` для звичайного текстового повідомлення. */
  imageUrl: string | null;
  createdAt: Date;
  sender: MessageParticipant | null;
}

export interface ListMessagesResult {
  messages: Message[];
  nextCursor: string | null;
}

/**
 * Один пункт списку розмов користувача (`listConversationsForUser`,
 * MSG+.1.1). `otherParticipant` — `null` у крайньому випадку, коли
 * другий учасник видалив акаунт (`ConversationParticipant` каскадно
 * видаляється разом з юзером, MSG+.0.4 — на відміну від `Message`,
 * це запис членства, а не вміст переписки) — розмова й повідомлення
 * лишаються, але "живого" другого учасника показати вже нема кого.
 */
export interface ConversationListItem {
  id: string;
  createdAt: Date;
  otherParticipant: MessageParticipant | null;
  lastMessage: { body: string; createdAt: Date; senderId: string | null } | null;
  unreadCount: number;
}
