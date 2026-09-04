"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCapIcon,
  ChatIcon,
  UsersIcon,
  ShieldIcon,
  LogoutIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface AdminSidebarProps {
  onLogout?: () => void;
  className?: string;
}

/**
 * Пункти навігації адмінки, за мокапом `adminPanel.png` (задача 0.13.1):
 * Курси, Коментарі, Юзери (третій пункт мокап явно показує в сайдбарі,
 * хоча задача 0.13.1 називала його "опційно" — раз він є в макеті, робимо
 * повноцінним пунктом навігації, не опускаємо). "Скарги" — MSG+.4.2
 * (04.09.2026), `ShieldIcon` — та сама іконка, що вже позначає
 * адмін-модерацію по проєкту (адмінське видалення коментаря,
 * `CommentCard`; посилання на адмінку, `AccountDropdown`).
 */
export const ADMIN_NAV_ITEMS = [
  { label: "Курси", href: "/admin/courses", icon: GraduationCapIcon },
  { label: "Коментарі", href: "/admin/comments", icon: ChatIcon },
  { label: "Юзери", href: "/admin/users", icon: UsersIcon },
  { label: "Скарги", href: "/admin/reports", icon: ShieldIcon },
];

/**
 * Вертикальний сайдбар адмін-панелі (задача 0.13.1): логотип "NATALIEVA" +
 * лейбл "ADMIN" зверху, пункти навігації з іконками (активний — акцентний
 * фон/текст за поточним шляхом), "Вийти" знизу. Той самий структурний
 * патерн, що `AccountSidebar` кабінету користувача, але БЕЗ декоративного
 * блоку "КРАСА У ТВОЇХ РУКАХ" — в адмінці мокап його не показує.
 *
 * Видимий лише на планшеті/десктопі (`md:flex`) — на мобільному замість
 * нього `AdminMobileNav` (той самий підхід, що `AccountMobileNav`).
 */
export function AdminSidebar({ onLogout, className }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "hidden w-60 shrink-0 flex-col gap-1 border-r border-rose-line/40 bg-white px-4 py-6 md:flex",
        className,
      )}
      aria-label="Навігація адмінки"
    >
      <Link href="/admin/courses" className="mb-6 block px-2">
        <span className="font-serif text-xl tracking-wide text-accent-dark">
          NATALIEVA
        </span>
        <span className="mt-0.5 block text-[10px] font-medium tracking-[0.25em] text-muted">
          ADMIN
        </span>
      </Link>

      {ADMIN_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors",
              active
                ? "bg-accent-soft/70 font-medium text-accent-dark"
                : "text-ink/80 hover:bg-cream-soft",
            )}
          >
            <Icon size={18} className={active ? "text-accent-dark" : "text-muted"} />
            {label}
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onLogout}
        className="mt-auto flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-ink/80 transition-colors hover:bg-cream-soft"
      >
        <LogoutIcon size={18} className="text-muted" />
        Вийти
      </button>
    </nav>
  );
}
