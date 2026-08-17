"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV_ITEMS } from "@/components/account/AccountSidebar";
import { LogoutIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface AccountMobileNavProps {
  onLogout?: () => void;
}

/**
 * Нижнє меню кабінету на мобільному (задача 0.8.8): фіксована панель знизу
 * екрана з тими самими пунктами, що й `AccountSidebar` (Мій профіль/Моє
 * навчання/Домашні завдання/Сертифікати/Налаштування) + "Вийти". Видима
 * лише нижче `lg` (`lg:hidden`) — на десктопі замість неї показується повний
 * вертикальний `AccountSidebar`.
 *
 * "Вийти" тут явно потрібен: кнопка "Вихід" в `AccountButton` (хедер)
 * прихована нижче `sm`, тож без цього пункту логаут був би недоступний на
 * мобільному взагалі.
 */
export function AccountMobileNav({ onLogout }: AccountMobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Навігація кабінету"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-rose-line/40 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {ACCOUNT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const [hrefPath] = href.split("#");
        const active = hrefPath === pathname;

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
