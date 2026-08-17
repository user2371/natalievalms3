"use client";

import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { UserIcon } from "@/components/ui/icons";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { cn } from "@/lib/utils";

export interface GuestProgressBannerProps {
  className?: string;
}

/**
 * Індикатор для незалогіненого відвідувача (задачі 5.18/5.19) — той самий
 * патерн, що вже є в `GuestHomeworkBanner.tsx`/`GuestCommentBanner.tsx`:
 * `useAuthModal().openAuthModal("register")` як `onClick` кнопки. Показує,
 * що прогрес гостя (`useProgress`/`localProgress.ts`, Фаза 5) зберігається
 * лише в `localStorage` цього браузера — і зникне при очищенні кешу/на
 * іншому пристрої, доки людина не зареєструється.
 *
 * `status === "authenticated"` → `null`: залогіненим користувачам це
 * попередження не актуальне (хоча реальна серверна синхронізація прогресу
 * через `modules/progress` — Фаза 7, ще не існує; банер каже правду лише
 * про те, ЩО прогрес гостя локальний, а не обіцяє, що в залогіненого він
 * уже синхронізований).
 */
export function GuestProgressBanner({ className }: GuestProgressBannerProps) {
  const { status } = useSession();
  const { openAuthModal } = useAuthModal();

  if (status === "authenticated") {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl bg-cream-soft/60 px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left",
        className,
      )}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent-dark">
          <UserIcon size={16} />
        </span>
        <span className="text-sm text-ink">
          Прогрес зберігається локально в цьому браузері. Зареєструйтесь, щоб не втратити
          його.
        </span>
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => openAuthModal("register")}
      >
        Зареєструватися
      </Button>
    </div>
  );
}
