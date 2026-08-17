import { prisma } from "@/lib/prisma";

/**
 * `modules/leaderboard/service.ts` (задача 6.6.8) — побудова рейтингу за
 * сумою балів (`PointsLedger`, `modules/points`).
 *
 * MVP-підхід: рахуємо суму балів по всіх юзерах через
 * `pointsLedger.groupBy`, довантажуємо дані КОРИСТУВАЧІВ, у яких є хоча б
 * один запис у журналі балів (юзери без жодного бала в рейтингу не
 * фігурують — так само, як і в мокапі, де топ-100 складається лише з
 * активних учасників), сортуємо в пам'яті. Годиться для масштабу цього
 * MVP; для великої бази користувачів знадобився б SQL-запит із вбудованим
 * сортуванням/пагінацією на рівні БД — свідомо не робили, за межі
 * 6.6.8–6.6.10 не виходили.
 */

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
}

function displayName(user: {
  nickname: string | null;
  firstName: string;
  lastName: string | null;
}): string {
  if (user.nickname) return user.nickname;
  return `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`;
}

/**
 * Повний відсортований рейтинг (без обрізання) — приватна допоміжна
 * функція, з якої й топ-N (`getTopLeaderboardService`), і місце
 * конкретного юзера (`getUserLeaderboardEntryService`) беруть дані з
 * ОДНІЄЇ узгодженої сортованої послідовності.
 */
async function buildFullRanking(): Promise<LeaderboardEntry[]> {
  const totals = await prisma.pointsLedger.groupBy({
    by: ["userId"],
    _sum: { amount: true },
  });

  if (totals.length === 0) return [];

  const userIds = totals.map((entry) => entry.userId);
  const users: {
    id: string;
    firstName: string;
    lastName: string | null;
    nickname: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  }[] = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  const usersById = new Map(users.map((user) => [user.id, user]));

  const withTotals = totals
    .map((entry) => {
      const user = usersById.get(entry.userId);
      if (!user) return null;
      return {
        userId: entry.userId,
        totalPoints: entry._sum.amount ?? 0,
        name: displayName(user),
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  // Спадаюче за балами; тай-брейк — раніше зареєстрований вище при рівних балах.
  withTotals.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  return withTotals.map((entry, index) => ({
    rank: index + 1,
    userId: entry.userId,
    name: entry.name,
    avatarUrl: entry.avatarUrl,
    totalPoints: entry.totalPoints,
  }));
}

export async function getTopLeaderboardService(limit = 100): Promise<LeaderboardEntry[]> {
  const full = await buildFullRanking();
  return full.slice(0, limit);
}

/** Місце й бали КОНКРЕТНОГО користувача в повному рейтингу (навіть якщо поза топ-N). */
export async function getUserLeaderboardEntryService(
  userId: string,
): Promise<LeaderboardEntry | null> {
  const full = await buildFullRanking();
  return full.find((entry) => entry.userId === userId) ?? null;
}
