// `modules/messages/index.ts` — ФАЗА MSG+, задача MSG+.1.4 (03.09.2026).
// Публічний експорт модуля. UI-компоненти та сторінки (`app/**`, MSG+.3,
// ще не реалізовано) імпортують ТІЛЬКИ звідси, ніколи напряму з
// `repository.ts`/`service.ts` (правило з `CLAUDE.md`, розділ
// "Архітектура модулів"), той самий підхід, що й у `modules/comments/index.ts`.

export {
  startConversationAction,
  sendMessageAction,
  uploadMessageImageAction,
  listMessagesAction,
  listConversationsAction,
  markConversationReadAction,
  blockUserAction,
  unblockUserAction,
  getBlockStatusAction,
  reportMessageAction,
  listMessageReportsAction,
  reviewReportAction,
  markReportReviewedAction,
} from "./actions";
export {
  listConversationsService,
  startConversationService,
  sendMessageService,
  assertCanUploadMessageImage,
  listMessagesService,
  markConversationReadService,
  blockUserService,
  unblockUserService,
  getBlockStatusService,
  reportMessageService,
  listMessageReportsService,
  reviewReportService,
  markReportReviewedService,
} from "./service";
export type { MessageActor } from "./service";
export {
  StartConversationSchema,
  SendMessageSchema,
  UploadMessageImageSchema,
  MESSAGE_IMAGE_MAX_SIZE_BYTES,
  MESSAGE_IMAGE_ALLOWED_MIME_TYPES,
  ListMessagesSchema,
  MarkConversationReadSchema,
  BlockUserSchema,
  UnblockUserSchema,
  GetBlockStatusSchema,
  ReportMessageSchema,
  AdminReportIdSchema,
} from "./schema";
export type {
  Message,
  MessageParticipant,
  ListMessagesResult,
  ConversationListItem,
  StartConversationInput,
  SendMessageInput,
  UploadMessageImageInput,
  ListMessagesInput,
  MarkConversationReadInput,
  BlockUserInput,
  UnblockUserInput,
  GetBlockStatusInput,
  BlockStatus,
  ReportMessageInput,
  AdminReportIdInput,
  MessageReportListItem,
  ModerationLogEntry,
  ReportReviewData,
} from "./schema";
