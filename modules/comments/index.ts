// `modules/comments/index.ts` (задача 6.5.6) — публічний експорт модуля.
// UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ звідси, ніколи
// напряму з `repository.ts`/`service.ts` (правило з `CLAUDE.md`, розділ
// "Архітектура модулів"), той самий підхід, що й у `modules/quizzes/index.ts`.

export { addCommentAction, deleteCommentAction, reactToCommentAction } from "./actions";
export {
  getCommentsByLessonIdService,
  listAllCommentsService,
  addCommentService,
  deleteCommentService,
  reactToCommentService,
} from "./service";
export { CreateCommentSchema, DeleteCommentSchema, ReactToCommentSchema } from "./schema";
export type {
  Comment,
  CommentAuthor,
  CreateCommentInput,
  DeleteCommentInput,
  ReactToCommentInput,
} from "./schema";
export type { AdminCommentItem } from "./repository";
