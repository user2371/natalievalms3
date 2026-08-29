// `modules/courses/index.ts` (задача 3.5) — публічний експорт модуля.
// UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ звідси, ніколи
// напряму з `repository.ts`/`service.ts` (правило з `CLAUDE.md`, розділ
// "Архітектура модулів").

export { createCourseAction, updateCourseAction, deleteCourseAction } from "./actions";
export {
  listCoursesService,
  getCourseBySlugService,
  getCourseByIdService,
} from "./service";
export { CreateCourseSchema, UpdateCourseSchema } from "./schema";
export {
  COURSE_COVER_MAX_SIZE_BYTES,
  COURSE_COVER_ALLOWED_MIME_TYPES,
} from "./schema";
export type { Course, CreateCourseInput, UpdateCourseInput } from "./schema";
