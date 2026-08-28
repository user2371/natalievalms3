// `modules/homeworkAssignments/index.ts` — публічний експорт модуля.
// UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ звідси
// (правило з `CLAUDE.md`, розділ "Архітектура модулів").
//
// HW+.1.6 — реекспортує ЛИШЕ з `actions.ts` (захищений `"use server"`-
// кордон) і "чистого" `service.ts` (`getHomeworkAssignmentByLessonIdService`
// напряму — він не чіпає Cloudinary, той самий принцип, що
// `modules/certificates/index.ts` після CERT+.1.6-фіксу). НІКОЛИ не
// реекспортує `uploadService.ts` напряму.

export {
  upsertHomeworkAssignmentAction,
  uploadHomeworkImageAction,
} from "./actions";
export { getHomeworkAssignmentByLessonIdService } from "./service";
export { UpsertHomeworkAssignmentSchema } from "./schema";
export type { HomeworkAssignment, UpsertHomeworkAssignmentInput } from "./schema";
