"use client";

import { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { AccountMobileNav } from "@/components/account/AccountMobileNav";
import { useSession, signOut } from "next-auth/react";
import { GuestGate } from "@/components/account/GuestGate";

export interface AccountLayoutProps {
  user?: { name: string; avatarUrl: string | null } | null;
  onLogout?: () => void;
  children: ReactNode;
  description?: string;
}

/**
 * Спільний каркас сторінок кабінету (задача 0.8.1): `Header` + двоколонковий
 * layout (`AccountSidebar` зліва, sticky на десктопі, + контент справа).
 * Використовується на `/profile` і перевикористовується майбутніми
 * `/my-learning`, `/settings`, `/certificates` — сторінка передає лише свій
 * вміст як `children`.
 *
 * Адаптив (задача 0.8.8): нижче `lg` `AccountSidebar` прихований, замість
 * нього — фіксоване нижнє меню `AccountMobileNav`. `pb-20` на контенті
 * компенсує висоту фіксованої панелі, щоб останній блок сторінки не
 * ховався під нею.
 */
export function AccountLayout({
  user: propUser,
  onLogout: propOnLogout,
  children,
  description = "особистого кабінету",
}: AccountLayoutProps) {
  const { data: session, status } = useSession();

  // За прямим проханням користувача: раніше сторінки, що передають `user`
  // (`/profile`, `/my-learning`, `/settings`, `/homework`, `/certificates`
  // — усі через цей `AccountLayout`), давали в `Header` лише
  // `{ name, avatarUrl }` БЕЗ `role`. Через це `Header.tsx` (його власний
  // `isAdmin = user?.role === "ADMIN"`) завжди бачив "не адмін" на цих
  // сторінках — пункт "Панель адміністратора" в дропдауні зникав скрізь,
  // крім головної (`/`, де `<Header />` рендериться без пропа й бере роль
  // напряму з сесії). `role` тепер завжди підмішується з сесії — незалежно
  // від того, що передала конкретна сторінка в `propUser`.
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;

  const user =
    propUser !== undefined
      ? propUser
        ? { ...propUser, role: sessionRole }
        : null
      : session?.user
        ? {
            name: session.user.name || "Користувач",
            avatarUrl:
              (session.user as { avatarUrl?: string }).avatarUrl || session.user.image,
            role: sessionRole,
          }
        : null;

  // Fixes (02.08.2026): той самий фікс, що в `Header.tsx` — клієнтський
  // `signOut` замість server action `logoutUserAction()`, яка не
  // синхронізувала клієнтський `useSession()` без перезавантаження сторінки.
  const onLogout = propOnLogout || (() => signOut({ redirect: false }));

  // За прямим проханням користувача, 26.07.2026: кнопка "Панель
  // адміністратора" в сайдбарі — з реальної сесії, а не з `DEMO_PROFILE`
  // (той лишається лише джерелом даних для відображення name/avatar на
  // деяких сторінках, не для перевірки ролі).
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  if (status === "unauthenticated" && propUser === undefined) {
    return <GuestGate description={description} />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header user={user} onLogout={onLogout} />

      <main className="flex-1 py-8 pb-24 sm:py-10 lg:pb-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 lg:grid-cols-[240px_1fr]">
          <AccountSidebar
            className="lg:sticky lg:top-24 lg:h-fit"
            onLogout={onLogout}
            isAdmin={isAdmin}
          />

          <div className="min-w-0">{children}</div>
        </div>
      </main>

      <AccountMobileNav onLogout={onLogout} />
    </div>
  );
}
