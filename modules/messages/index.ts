// `modules/messages/index.ts` — ФАЗА MSG+, задача MSG+.1.4 (03.09.2026).
// Публічний експорт модуля. UI-компоненти та сторінки (`app/**`, MSG+.3,
// ще не реалізовано) імпортують ТІЛЬКИ звідси, ніколи напряму з
// `repository.ts`/`service.ts` (правило з `CLAUDE.md`, розділ
// "Архітектура модулів"), той самий підхід, що й у `modules/comments/index.ts`.

export {
  startConversationAction,
  sendMessageAction,
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
