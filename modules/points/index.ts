// `modules/points/index.ts` (задача 6.6.7) — публічний експорт модуля.
// UI-компоненти та сторінки (`app/**`), а також ІНШІ модулі, імпортують
// ТІЛЬКИ звідси, ніколи напряму з `repository.ts`/`service.ts` (правило з
// `CLAUDE.md`, розділ "Архітектура модулів").

export { getUserPointsAction } from "./actions";
export {
  awardLessonPoints,
  awardCoursePoints,
  getPointsSummaryService,
  getPointsHistoryService,
  getUserRankService,
  getRankedUsersCountService,
} from "./service";
export { PointsReasonSchema } from "./schema";
export type {
  PointsReason,
  PointsLedgerEntry,
  PointsSummary,
  RankedPointsEntry,
} from "./schema";
