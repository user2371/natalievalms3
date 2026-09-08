"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV_ITEMS } from "@/components/account/AccountSidebar";
import { LogoutIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface AccountMobileNavProps {
  onLogout?: () => void;
  /** Той самий бейдж, що в `AccountSidebar` (MSG+.2.4/.3.1) — на пункті "Повідомлення". */
  unreadMessagesCount?: number;
}

/**
 * MOBILENAV+.1.1 (08.09.2026, за прямим проханням користувача — "на
 * мобілці забери внизу лінки домашнє завдання, та сертифікати бо для
 * них мало місця"): нижнє меню — вужчий підмножинний список порівняно з
 * повним `ACCOUNT_NAV_ITEMS` десктопного `AccountSidebar`. "Домашні
 * завдання" й "Сертифікати" прибрано ЛИШЕ звідси (не з
 * `ACCOUNT_NAV_ITEMS` — десктопний сайдбар і далі показує всі пункти);
 * обидві сторінки лишаються доступними на мобільному іншими шляхами
 * (картки на `/profile`, `/my-learning`), просто без власної кнопки в
 * тісній нижній панелі.
 */
const MOBILE_NAV_ITEMS = ACCOUNT_NAV_ITEMS.filter(
  ({ href }) => href !== "/homework" && href !== "/certificates",
);

/**
 * Нижнє меню кабінету на мобільному (задача 0.8.8): фіксована панель знизу
 * екрана. Видима лише нижче `lg` (`lg:hidden`) — на десктопі замість неї
 * показується повний вертикальний `AccountSidebar`.
 *
 * `grid-cols-5` (MOBILENAV+.1.1, 08.09.2026): БУЛО `grid-cols-7` — 6
 * пунктів `ACCOUNT_NAV_ITEMS` + "Вийти", але 7 колонок на вузькому
 * екрані лишали замало місця на пункт (за прямим проханням користувача
 * прибрано "Домашні завдання" й "Сертифікати" — див. `MOBILE_NAV_ITEMS`
 * вище); тепер 4 пункти + "Вийти" = 5 колонок.
 *
 * "Вийти" тут явно потрібен: кнопка "Вихід" в `AccountButton` (хедер)
 * прихована нижче `sm`, тож без цього пункту логаут був би недоступний на
 * мобільному взагалі.
 */
export function AccountMobileNav({ onLogout, unreadMessagesCount }: AccountMobileNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Навігація кабінету"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-rose-line/40 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {MOBILE_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const [hrefPath] = href.split("#");
        const active = hrefPath === pathname;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-col items-center gap-1 py-2.5 text-[10px] leading-none",
              active ? "text-accent-dark" : "text-muted",
            )}
          >
            <Icon size={19} />
            {href === "/messages" && !!unreadMessagesCount && (
              <span className="absolute right-[22%] top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-accent px-1 text-[8px] font-medium text-white">
                {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
              </span>
            )}
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
