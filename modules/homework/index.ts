// `modules/homework/index.ts` — публічний експорт модуля. UI-компоненти та
// сторінки (`app/**`) імпортують ТІЛЬКИ звідси, ніколи напряму з
// `repository.ts`/`service.ts` (правило з `CLAUDE.md`, розділ "Архітектура
// модулів"), той самий підхід, що й у `modules/comments/index.ts`.

export { submitHomeworkAction } from "./actions";
export { getHomeworkForLessonService, submitHomeworkService } from "./service";
export { SubmitHomeworkSchema } from "./schema";
export type { HomeworkSubmission, SubmitHomeworkInput } from "./schema";
