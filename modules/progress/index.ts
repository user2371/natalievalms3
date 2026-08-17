// `modules/progress/index.ts` (задача 7.5) — публічний експорт модуля.
// UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ звідси (правило
// з `CLAUDE.md`, розділ "Архітектура модулів").

export { syncLocalProgressAction, getCourseProgressAction } from "./actions";
export { syncLocalProgressService, mergeProgress, getCourseProgressMapService } from "./service";
export { UpsertProgressEntrySchema, UpsertProgressInputSchema } from "./schema";
export type { Progress, UpsertProgressEntry, UpsertProgressInput } from "./schema";
