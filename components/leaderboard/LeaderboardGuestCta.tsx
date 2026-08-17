"use client";

import { Button } from "@/components/ui/Button";
import { useAuthModal } from "@/components/auth/AuthModalContext";

/**
 * Винесено в окремий клієнтський компонент (задача 6.6.11), бо сама
 * сторінка `/leaderboard` тепер Server Component (реальні дані
 * завантажуються на сервері) — а відкриття AuthModal потребує клієнтського
 * `useAuthModal()`. Той самий "малий клієнтський острівець всередині
 * серверної сторінки" підхід, що вже застосований для
 * `RealCommentsBlock`/`RealQuizBlock`.
 */
export function LeaderboardGuestCta() {
  const { openAuthModal } = useAuthModal();

  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-accent-soft/40 p-5 text-center sm:flex-row sm:justify-between sm:text-left">
      <p className="text-sm text-ink">
        Зареєструйся, щоб проходити курси, заробляти бали та потрапити в рейтинг!
      </p>
      <Button size="sm" className="shrink-0" onClick={() => openAuthModal("register")}>
        Зареєструватись
      </Button>
    </div>
  );
}
