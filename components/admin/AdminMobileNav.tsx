"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/components/admin/AdminSidebar";
import { LogoutIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface AdminMobileNavProps {
  onLogout?: () => void;
}

/**
 * Нижнє меню адмінки на мобільному/планшеті нижче `md` — той самий патерн,
 * що `AccountMobileNav` кабінету користувача. Мокап `adminPanel.png`
 * показує лише десктопну версію сайдбару; мобільна адаптація адмінки —
 * Фаза 9 (задача 9.11, "мінімально"), тож тут — базовий робочий варіант,
 * не фінальне полірування.
 * `grid-cols-5` (04.09.2026, MSG+.4.2) — 4 пункти `ADMIN_NAV_ITEMS` + "Вийти", той самий принцип, що колонки рахувались уручну (`AccountMobileNav`, MSG+.3.1: grid-cols-6 → grid-cols-7).
 */
export function AdminMobileNav({ onLogout }: AdminMobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Навігація адмінки"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-rose-line/40 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {ADMIN_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px] leading-none",
              active ? "text-accent-dark" : "text-muted",
            )}
          >
            <Icon size={19} />
            <span className="truncate px-0.5">{label}</span>
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onLogout}
        className="flex flex-col items-center gap-1 py-2.5 text-[10px] leading-none text-muted"
      >
        <LogoutIcon size={19} />
        <span>Вийти</span>
      </button>
    </nav>
  );
}
