// `modules/articles/index.ts` — публічний експорт модуля. UI-компоненти
// та сторінки (`app/**`) імпортують ТІЛЬКИ звідси (правило з
// `CLAUDE.md`, розділ "Архітектура модулів").

export { upsertArticleAction } from "./actions";
export { getArticleByLessonIdService, upsertArticleService } from "./service";
export { UpsertArticleSchema } from "./schema";
export type { Article, UpsertArticleInput } from "./schema";
