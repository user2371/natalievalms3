// `modules/leaderboard/index.ts` (задача 6.6.10) — публічний експорт
// модуля. UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ звідси
// (правило з `CLAUDE.md`, розділ "Архітектура модулів").

export { getLeaderboardAction } from "./actions";
export { getTopLeaderboardService, getUserLeaderboardEntryService } from "./service";
export type { LeaderboardEntry } from "./service";
