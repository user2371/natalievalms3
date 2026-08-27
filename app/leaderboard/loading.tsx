import { Header } from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Скелетон `/leaderboard` (ФАЗА SKELETON, задача SKEL.9) — той самий
 * hero-банер (іконка + заголовок + опис) + подіум із 3 карток
 * (`sm:grid-cols-3`, середня трохи піднята — `LeaderboardRow`/подіум із
 * реальної сторінки) + список рядків рейтингу (аватар-коло + ім'я + бали),
 * поки `getLeaderboardService` виконує запит на сервері.
 */
export default function LeaderboardLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 pb-16">
        <div className="border-b border-rose-line/30 bg-accent-soft/30 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
              <Skeleton className="h-8 w-56" />
            </div>
            <Skeleton className="mt-3 h-4 w-full max-w-xl" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <div className="mt-10 grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
            {[1, 0, 2].map((order, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-3 rounded-2xl border border-rose-line/40 bg-white p-6"
                style={{ order }}
              >
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-rose-line/40 bg-white p-5">
            <div className="flex flex-col gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl px-3 py-3">
                  <Skeleton className="h-5 w-6 shrink-0" />
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <Skeleton className="h-4 flex-1 max-w-[200px]" />
                  <Skeleton className="h-4 w-12 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
