import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { Avatar } from "@/components/ui/Avatar";
import { LeaderboardGuestCta } from "@/components/leaderboard/LeaderboardGuestCta";
import {
  TrophyIcon,
  SparkleIcon,
  UsersIcon,
  StarIcon,
  TrendingUpIcon,
  GiftIcon,
  UserIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import {
  getTopLeaderboardService,
  getUserLeaderboardEntryService,
} from "@/modules/leaderboard";
import type { LeaderboardEntry } from "@/modules/leaderboard";
import type { Metadata } from "next";
import Link from "next/link";
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: "Рейтинг учениць",
  description:
    "Топ учениць Natalieva за балами: конкуруй, заробляй бали й піднімайся в рейтингу.",
};

const MEDAL_STYLES: Record<number, string> = {
  1: "bg-accent text-white",
  2: "bg-rose-line/70 text-ink",
  3: "bg-accent-soft text-accent-dark",
};

const PROMO_ITEMS = [
  {
    icon: UsersIcon,
    title: "Конкуруй",
    description: "Змагайся з найкращими майстрами манікюру",
  },
  {
    icon: StarIcon,
    title: "Заробляй бали",
    description: "За проходження уроків, тестів та курсів",
  },
  {
    icon: TrendingUpIcon,
    title: "Піднімайся в рейтингу",
    description: "Чим більше балів — тим вище твоє місце",
  },
  {
    icon: GiftIcon,
    title: "Отримуй досягнення",
    description: "Топ користувачі отримують особливі відзнаки",
  },
];

function LeaderboardRow({ entry, isOwn }: { entry: LeaderboardEntry; isOwn: boolean }) {
  const rowClassName = cn(
    "flex items-center gap-4 rounded-xl px-3 py-3 transition-colors",
    isOwn ? "bg-accent-soft/50 ring-1 ring-accent/40" : "hover:bg-cream-soft",
  );

  return (
    <Link href={`/users/${entry.userId}`} className={rowClassName}>
      <span className="w-10 shrink-0 text-sm text-muted">{entry.rank}</span>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar src={entry.avatarUrl} name={entry.name} size={40} role={entry.role} />
        <span className="truncate text-sm font-medium text-ink">{entry.name}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-ink">
        {entry.totalPoints.toLocaleString("uk-UA")}
        <SparkleIcon size={14} className="text-accent-dark" />
      </span>
    </Link>
  );
}

/**
 * Сторінка "Топ 100" (`/leaderboard`) — задачі 6.6.11: реальні дані замість
 * `PODIUM`/`LEADERBOARD_TABLE` (`lib/data/leaderboard.ts`, більше НЕ
 * імпортується тут; сам файл лишили — на нього може ще спиратись інший
 * демо-контент, не чіпали).
 *
 * Перетворено на Server Component (той самий фікс, що й для `/courses` у
 * задачі 3.21) — `getTopLeaderboardService`/`getUserLeaderboardEntryService`
 * (`modules/leaderboard`, задачі 6.6.8–6.6.10) вантажаться на сервері,
 * `Header` без пропсів сам читає сесію. Єдиний клієнтський "острівець" —
 * `LeaderboardGuestCta` (кнопка реєстрації відкриває AuthModal).
 *
 * П'єдестал (топ-3, порядок карток 2/1/3, той самий вигляд, що в
 * попередній демо-версії) рендериться, лише якщо реальних учасників
 * рейтингу вже щонайменше 3 — з малою кількістю реальних користувачів на
 * ранньому етапі проєкту показувати "п'єдестал" із порожніми місцями було
 * б нечесно; замість нього одразу таблиця (працює і для 0 учасників —
 * порожній стан, ще один запис у списку робіт для UX, свідомо не
 * заводили окремий empty-state текст поза межами цих 10 задач).
 *
 * Підсвітка власного рядка (`isOwn`) і банер "Ваше місце: N" — за
 * `currentUser` із сесії (`auth()`), не по клієнтському тумблеру, як було
 * в демо-версії.
 *
 * F.27.7: локальна `LeaderboardAvatar` (власна копія `<img>`/ініціалів)
 * прибрана — сторінка тепер використовує спільний `components/ui/Avatar.tsx`
 * (варіант 2 з плану, рекомендований), тож бейдж "M" (F.27.3) підхоплюється
 * автоматично й друга копія логіки аватарки більше не дублюється.
 */
export default async function LeaderboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const top100 = await getTopLeaderboardService(100).catch(() => []);

  let currentUser: LeaderboardEntry | null = null;
  if (userId) {
    const inTop100 = top100.find((entry) => entry.userId === userId);
    currentUser =
      inTop100 ?? (await getUserLeaderboardEntryService(userId).catch(() => null));
  }

  const ownInTop100 = Boolean(
    currentUser && top100.some((e) => e.userId === currentUser?.userId),
  );
  const ownOutsideTop100 = Boolean(currentUser && !ownInTop100);

  const showPodium = top100.length >= 3;
  const podium = showPodium ? [top100[1], top100[0], top100[2]] : [];
  const tableEntries = showPodium ? top100.slice(3) : top100;

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 pb-16">
        <div className="border-b border-rose-line/30 bg-accent-soft/30 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-accent-dark">
                <TrophyIcon size={22} />
              </span>
              <h1 className="font-serif text-3xl text-ink sm:text-4xl">
                Топ 100 користувачів
              </h1>
            </div>
            <p className="mt-2.5 max-w-xl text-sm text-muted sm:text-base">
              Рейтинг оновлюється щодня. Заробляйте бали за проходження курсів та уроків:
              +1 бал за урок, +5 балів за завершений курс!
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6">
          {showPodium && (
            <div className="mt-10 grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
              {podium.map((entry) => {
                if (!entry) return null;
                const isFirst = entry.rank === 1;
                return (
                  <Link
                    key={entry.rank}
                    href={`/users/${entry.userId}`}
                    className={cn(
                      "relative flex flex-col items-center gap-3 rounded-2xl border bg-white p-6 text-center",
                      isFirst ? "border-accent sm:-translate-y-3" : "border-rose-line/40",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-4 left-4 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                        MEDAL_STYLES[entry.rank],
                      )}
                    >
                      {entry.rank}
                    </span>
                    <Avatar src={entry.avatarUrl} name={entry.name} size={80} role={entry.role} />
                    <span className="font-medium text-ink">{entry.name}</span>
                    <span className="flex items-center gap-1 font-serif text-xl text-ink">
                      {entry.totalPoints.toLocaleString("uk-UA")}
                      <SparkleIcon size={16} className="text-accent-dark" />
                      <span className="text-sm font-sans text-muted">балів</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-rose-line/40 bg-white p-5">
            <div className="flex items-center gap-4 border-b border-rose-line/30 px-3 pb-3 text-xs font-medium tracking-wide text-muted uppercase">
              <span className="w-10 shrink-0">Місце</span>
              <span className="flex-1">Користувач</span>
              <span className="shrink-0">Бали</span>
            </div>

            <div className="mt-1 flex max-h-[640px] flex-col gap-1 overflow-y-auto">
              {tableEntries.length > 0 ? (
                tableEntries.map((entry) => (
                  <LeaderboardRow
                    key={entry.rank}
                    entry={entry}
                    isOwn={ownInTop100 && entry.userId === currentUser?.userId}
                  />
                ))
              ) : (
                <p className="py-8 text-center text-sm text-muted">
                  Рейтинг поки порожній — станьте першими, хто заробить бали!
                </p>
              )}
            </div>

            {ownOutsideTop100 && currentUser && (
              <>
                <p className="py-3 text-center text-sm text-muted">…</p>
                <div className="flex flex-col gap-3 rounded-xl bg-accent-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-accent-dark">
                      <UserIcon size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        Ви не потрапляєте в Топ 100
                      </p>
                      <p className="text-sm text-muted">
                        Проходьте курси та заробляйте бали, щоб піднятись у рейтингу!
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                    <span className="text-sm text-muted">Ваше місце:</span>
                    <span className="rounded-lg border border-rose-line bg-white px-3 py-1.5 font-serif text-lg text-ink">
                      {currentUser.rank}
                    </span>
                  </div>
                </div>
              </>
            )}

            {!userId && <LeaderboardGuestCta />}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 rounded-2xl border border-rose-line/40 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROMO_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex flex-col items-center gap-2 text-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
                  <item.icon size={20} />
                </span>
                <p className="font-serif text-base text-ink">{item.title}</p>
                <p className="text-sm text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
