"use server";

import { auth } from "@/auth";
import * as service from "./service";

/**
 * `modules/points/actions.ts` (задача 6.6.6) — server action, викликає
 * лише `service.ts`, той самий поділ, що й у решті модулів.
 *
 * Публічна дія (НЕ вимагає сесії від того, ХТО дивиться) — бали й місце в
 * рейтингу не приватна інформація (та сама відкритість, що й на
 * `/leaderboard`); якщо `userId` не передано явно, використовує сесію
 * викликача (для власного "Мій профіль"-кабінету).
 */
export async function getUserPointsAction(userId?: string) {
  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const session = await auth();
      targetUserId = session?.user?.id;
    }
    if (!targetUserId) {
      throw new Error("Не вказано користувача");
    }

    const [summary, rank] = await Promise.all([
      service.getPointsSummaryService(targetUserId),
      service.getUserRankService(targetUserId),
    ]);

    return {
      success: true as const,
      totalPoints: summary.totalPoints,
      rank,
      error: null,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося отримати бали";
    return { success: false as const, totalPoints: 0, rank: null, error: message };
  }
}
