// `modules/lessons/index.ts` (задача 3.10) — публічний експорт модуля.
// UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ звідси, ніколи
// напряму з `repository.ts`/`service.ts` (правило з `CLAUDE.md`, розділ
// "Архітектура модулів").

export {
  createLessonAction,
  updateLessonAction,
  deleteLessonAction,
  reorderLessonsAction,
  getLessonsWithCompletionAction,
} from "./actions";
export {
  listLessonsService,
  getLessonByIdService,
  getCurrentLessonService,
  listLessonsWithCompletionService,
} from "./service";
export { CreateLessonSchema, UpdateLessonSchema, ReorderLessonsSchema } from "./schema";
export type {
  Lesson,
  CreateLessonInput,
  UpdateLessonInput,
  ReorderLessonsInput,
} from "./schema";
export type { LessonWithCompletion } from "./service";
