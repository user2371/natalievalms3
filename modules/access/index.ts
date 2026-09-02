// `modules/access/index.ts` — ФАЗА PAID+, задача PAID+.1. Публічний
// експорт модуля. UI-компоненти та сторінки (`app/**`) імпортують
// ТІЛЬКИ звідси, ніколи напряму з `repository.ts`/`service.ts` (те саме
// правило з `CLAUDE.md`, що вже й для решти модулів).

export { hasCourseAccessService, assertCourseAccessService } from "./service";
export type { AccessCourseInput, AccessUserInput } from "./schema";
