// `modules/siteSettings/index.ts` (задача HOME+.1.5) — публічний експорт
// модуля. UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ звідси,
// ніколи напряму з `repository.ts`/`service.ts` (правило з `CLAUDE.md`,
// розділ "Архітектура модулів").

export {
  setFeaturedCourseAction,
  clearFeaturedCourseAction,
  getFeaturedCourseAction,
} from "./actions";
export { getFeaturedCourseService } from "./service";
export type { SiteSettings } from "./schema";
