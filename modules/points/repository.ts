import { prisma } from "@/lib/prisma";
import type { PointsLedgerEntry, PointsReason, RankedPointsEntry } from "./schema";

/**
 * `modules/points/repository.ts` (задача 6.6.3) — лише прямі запити до
 * Prisma, без бізнес-логіки (ідемпотентність нарахування — у
 * `service.ts`, задача 6.6.4), той самий поділ, що й в інших модулях.
 */

function mapEntry(raw: {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  lessonId: string | null;
  courseId: string | null;
  createdAt: Date;
}): PointsLedgerEntry {
  return { ...raw, reason: raw.reason as PointsReason };
}

export async function findByUserId(userId: string): Promise<PointsLedgerEntry[]> {
  const rows = await prisma.pointsLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapEntry);
}

export interface CreatePointsLedgerData {
  userId: string;
  amount: number;
  reason: PointsReason;
  lessonId?: string;
  courseId?: string;
}

export async function create(data: CreatePointsLedgerData): Promise<PointsLedgerEntry> {
  const row = await prisma.pointsLedger.create({
    data: {
      userId: data.userId,
      amount: data.amount,
      reason: data.reason,
      lessonId: data.lessonId ?? null,
      courseId: data.courseId ?? null,
    },
  });
  return mapEntry(row);
}

/** Сума всіх балів користувача (для профілю/рейтингу, задача 6.6.6+). */
export async function sumByUserId(userId: string): Promise<number> {
  const result = await prisma.pointsLedger.aggregate({
    where: { userId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/**
 * Рейтинг: userId + сума балів, відсортовано спадаюче (задача 6.6.3).
 * Тай-брейк за датою реєстрації (задача 6.6.8, "хто раніше зареєструвався
 * — вище при рівних балах") тут НЕ робимо — це вже логіка побудови
 * топ-100 (`modules/leaderboard/service.ts`, окрема майбутня задача), тут
 * лише сира агрегація по сумі балів.
 */
export async function findRanked(limit = 100): Promise<RankedPointsEntry[]> {
  const grouped = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });

  return grouped.map((entry: { userId: string; _sum: { amount: number | null } }) => ({
    userId: entry.userId,
    totalPoints: entry._sum.amount ?? 0,
  }));
}

/**
 * Чи вже нараховувались бали за КОНКРЕТНЕ досягнення (урок/курс) —
 * потрібно для ідемпотентності в `service.ts` (задача 6.6.4): не
 * нараховувати вдруге за той самий урок/курс.
 */
export async function findExistingAward(
  userId: string,
  reason: PointsReason,
  targetId: string,
): Promise<PointsLedgerEntry | null> {
  const row = await prisma.pointsLedger.findFirst({
    where:
      reason === "LESSON_COMPLETED"
        ? { userId, reason, lessonId: targetId }
        : { userId, reason, courseId: targetId },
  });
  return row ? mapEntry(row) : null;
}

/**
 * Місце користувача в загальному рейтингу за сумою балів (задача 6.6.6,
 * плумбінг для `getUserPointsAction`) — 1 + кількість користувачів із
 * СТРОГО більшою сумою балів. Користувачі без жодного запису в журналі
 * (0 балів) під час підрахунку `having` не враховуються серед "вищих" —
 * рахуються лише ті, у кого сума точно перевищує суму цільового юзера.
 */
export async function getUserRank(userId: string): Promise<number> {
  const userTotal = await sumByUserId(userId);

  const higherRanked = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    _sum: { amount: true },
    having: { amount: { _sum: { gt: userTotal } } },
  });

  return higherRanked.length + 1;
}

/**
 * Скільки всього УНІКАЛЬНИХ користувачів мають хоча б один запис у
 * журналі балів — потрібно для `rankOutOf` у `ProfileHero` (задача
 * 6.6.18, плумбінг). Юзери без жодного бала в цей підрахунок не входять
 * (той самий принцип, що й у `modules/leaderboard/service.ts` —
 * рейтинг рахує лише "активних" учасників).
 */
export async function countRankedUsers(): Promise<number> {
  const distinctUsers = await prisma.pointsLedger.groupBy({
    by: ["userId"],
  });
  return distinctUsers.length;
}
