"use server";

import { auth } from "@/auth";
import * as service from "./service";
import type { LeaderboardEntry } from "./service";

/**
 * `modules/leaderboard/actions.ts` (задача 6.6.9) — публічна дія (рейтинг
 * доступний і гостям, той самий принцип відкритості, що й
 * `getUserPointsAction` у `modules/points`).
 *
 * `currentUser` — місце й бали залогінованого викликача: якщо він УЖЕ в
 * `top100`, береться звідти (без другого запиту); якщо ні — окремий
 * `getUserLeaderboardEntryService` (для банера "Ваше місце: N" під
 * таблицею на `/leaderboard`). Для гостя — завжди `null`.
 */
export async function getLeaderboardAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const top100 = await service.getTopLeaderboardService(100);

    let currentUser: LeaderboardEntry | null = null;
    if (userId) {
      const inTop100 = top100.find((entry) => entry.userId === userId);
      currentUser = inTop100 ?? (await service.getUserLeaderboardEntryService(userId));
    }

    return { success: true as const, top100, currentUser, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося завантажити рейтинг";
    return { success: false as const, top100: [], currentUser: null, error: message };
  }
}
