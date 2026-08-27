"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Dropdown, DropdownContent, DropdownTrigger } from "@/components/ui/Dropdown";
import { AccountButton } from "@/components/layout/AccountButton";
import { AccountDropdown } from "@/components/layout/AccountDropdown";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { useSession, signOut } from "next-auth/react";

export interface HeaderUser {
  name: string;
  avatarUrl?: string | null;
  /** F.27.2: опційна роль — щоб виклики з явним `user`-пропом теж могли передати роль. */
  role?: string;
}

export interface HeaderProps {
  user?: HeaderUser | null;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { label: "Про курс", href: "/#about" },
  { label: "Програма", href: "/#program" },
  { label: "Всі курси", href: "/courses" },
  { label: "Топ 100", href: "/leaderboard" },
  { label: "Про майстра", href: "/#master" },
  { label: "Відгуки", href: "/#reviews" },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    >
      {open ? (
        <path d="M6 6l12 12M18 6 6 18" />
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function Header({ user: propUser, onLogout: propOnLogout }: HeaderProps) {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openAuthModal } = useAuthModal();

  const user =
    propUser !== undefined
      ? propUser
      : session?.user
        ? {
            name: session.user.name || "Користувач",
            avatarUrl:
              (session.user as { avatarUrl?: string }).avatarUrl || session.user.image,
            role: (session.user as { role?: string }).role,
          }
        : null;

  // F.27.2: той самий каст `session?.user as { role?: string }`, що вже в
  // `AccountLayout.tsx`/`RealCommentsBlock.tsx` — для пункту меню "Панель
  // адміністратора" (F.27.1) і бейджа "M" на власному аватарі (F.27.4).
  const isAdmin = user?.role === "ADMIN";

  // Fixes (02.08.2026): БУВ `logoutUserAction()` (server action, `modules/auth`)
  // — очищує сесію на сервері, але клієнтський `useSession()` (звідки `user`
  // вище) про це не дізнається без перезавантаження сторінки: server action
  // не має способу синхронізувати `SessionProvider`. Клієнтський `signOut`
  // (`next-auth/react`) якраз для цього — сам ходить на sign-out endpoint і
  // одразу оновлює сесію в усьому додатку (broadcast між усіма
  // `useSession()`-компонентами, без ручного `router.refresh()`).
  const onLogout = propOnLogout || (() => signOut({ redirect: false }));

  return (
    <header className="sticky top-0 z-30 border-b border-rose-line/30 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="font-serif text-2xl tracking-wide text-accent-dark">
            NATALIEVA
          </span>
          <span className="text-[10px] tracking-[0.2em] text-muted">
            GEL POLISH • NAIL EXTENSIONS
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-ink/80 hover:text-accent-dark"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Dropdown open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownTrigger>
                  <AccountButton
                    name={user.name}
                    avatarUrl={user.avatarUrl}
                    role={user.role}
                    open={dropdownOpen}
                    onToggle={() => setDropdownOpen((v) => !v)}
                    onLogout={onLogout ? () => onLogout() : undefined}
                  />
                </DropdownTrigger>
                <DropdownContent align="right">
                  <AccountDropdown
                    onNavigate={() => setDropdownOpen(false)}
                    isAdmin={isAdmin}
                  />
                </DropdownContent>
              </Dropdown>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAuthModal("login")}
              className="hidden sm:inline-flex"
            >
              Вхід
            </Button>
          )}

          <button
            type="button"
            aria-label={mobileOpen ? "Закрити меню" : "Відкрити меню"}
            onClick={() => setMobileOpen((v) => !v)}
            className="text-ink md:hidden"
          >
            <MenuIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-rose-line/30 bg-cream px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm text-ink/80"
              >
                {item.label}
              </a>
            ))}
          </nav>
          {!user && (
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                fullWidth
                onClick={() => openAuthModal("login")}
              >
                Вхід
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
