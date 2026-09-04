"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  UserIcon,
  GraduationCapIcon,
  UploadIcon,
  DiplomaIcon,
  GearIcon,
  LogoutIcon,
  ShieldIcon,
  ChatIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface AccountSidebarProps {
  onLogout?: () => void;
  className?: string;
  /** Показує пункт "Панель адміністратора" (посилання на `/admin`), якщо `true`. */
  isAdmin?: boolean;
  /**
   * MSG+.2.4/.3.1 (03.09.2026): бейдж-число на пункті "Повідомлення" —
   * підключення лічильника непрочитаних (`useUnreadMessagesCount`,
   * MSG+.2.4), яке в MSG+.2 було свідомо відкладено до появи реального
   * пункту меню. `undefined`/`0` — бейдж не рендериться.
   */
  unreadMessagesCount?: number;
}

/**
 * Пункти навігації кабінету, за мокапом `ProfilePage.png`. Оригінальний
 * опис задачі 0.8.2 згадував окремий пункт "Рейтинг" — рішення від
 * 13.07.2026 (див. підсумок у `TASKS_DETAILED.md`) прибрало його з нав-меню:
 * місце в рейтингу показується карткою на самій сторінці профілю, а не
 * пунктом сайдбару. "Повідомлення" додано ФАЗОЮ MSG+, задача MSG+.3.1
 * (03.09.2026) — тепер `/messages` реальний маршрут (MSG+.3), тож за
 * аналогією з рештою кабінету. Актуальний список: Мій профіль, Моє
 * навчання, Домашні завдання, Сертифікати, Повідомлення, Налаштування,
 * Вийти.
 */
export const ACCOUNT_NAV_ITEMS = [
  { label: "Мій профіль", href: "/profile", icon: UserIcon },
  { label: "Моє навчання", href: "/my-learning", icon: GraduationCapIcon },
  { label: "Домашні завдання", href: "/homework", icon: UploadIcon },
  { label: "Сертифікати", href: "/certificates", icon: DiplomaIcon },
  { label: "Повідомлення", href: "/messages", icon: ChatIcon },
  { label: "Налаштування", href: "/settings", icon: GearIcon },
];

/**
 * Вертикальне меню кабінету користувача (задача 0.8.2): Мій профіль / Моє
 * навчання / Домашні завдання / Сертифікати / Налаштування / Вийти, кожен
 * пункт з іконкою (задача 0.8.3). Активний пункт підсвічений фоном і
 * кольором тексту/іконки за поточним шляхом (`usePathname`, задача 0.8.4).
 * Пункт "Вийти" викликає переданий `onLogout` (задача 0.8.6). Нижче —
 * декоративний блок "КРАСА У ТВОЇХ РУКАХ" (задача 0.8.5).
 *
 * 26.07.2026, за прямим проханням користувача: коли `isAdmin` — над
 * "Вийти" з'являється додатковий пункт "Панель адміністратора" (посилання
 * на `/admin`, той самий дашборд, що вже захищений `middleware.ts` за
 * роллю `ADMIN`, задача 2.17 — цей пункт лише зручний вхід, не заміна
 * захисту). `isAdmin` обчислюється в `AccountLayout` з реальної сесії
 * (`session.user.role === "ADMIN"`), не з `DEMO_PROFILE`.
 *
 * Видима лише на десктопі (`lg:flex`, прихована на мобільному) — на
 * мобільному замість неї показується `AccountMobileNav` (задача 0.8.8,
 * нижнє меню замість повного сайдбару).
 *
 * Спільний компонент кабінету (задача 0.8) — використовується в
 * `AccountLayout` і перевикористовується сторінками `/profile`,
 * `/my-learning`, `/settings`, `/certificates`.
 */
export function AccountSidebar({ onLogout, className, isAdmin, unreadMessagesCount }: AccountSidebarProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("hidden flex-col gap-1 lg:flex", className)}
      aria-label="Навігація кабінету"
    >
      {ACCOUNT_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const [hrefPath] = href.split("#");
        const active = hrefPath === pathname;

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
            {href === "/messages" && !!unreadMessagesCount && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white">
                {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
              </span>
            )}
          </Link>
        );
      })}

      {isAdmin && (
        <Link
          href="/admin"
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors",
            pathname?.startsWith("/admin")
              ? "bg-accent-soft/70 font-medium text-accent-dark"
              : "text-ink/80 hover:bg-cream-soft",
          )}
        >
          <ShieldIcon
            size={18}
            className={pathname?.startsWith("/admin") ? "text-accent-dark" : "text-muted"}
          />
          Панель адміністратора
        </Link>
      )}

      <button
        type="button"
        onClick={onLogout}
        className="mt-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-ink/80 transition-colors hover:bg-cream-soft"
      >
        <LogoutIcon size={18} className="text-muted" />
        Вийти
      </button>

      <SidebarDecoration />
    </nav>
  );
}

/**
 * Декоративний нижній блок сайдбару (задача 0.8.5): мотто "КРАСА У ТВОЇХ
 * РУКАХ" на теплому фоні з мазками-декором — той самий мазковий мотив
 * (`stroke-linecap="round"`, товста крива лінія), що й у
 * `DecorativeBackground` на лендингу, лише зменшений і локальний для картки.
 * Суто оздоблення, тому `aria-hidden` на SVG.
 */
function SidebarDecoration() {
  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl bg-accent-soft/40 px-5 py-7 text-center">
      <svg
        aria-hidden
        className="absolute -left-6 -top-8 h-24 w-24 text-rose-line/40"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M10 150 Q60 80 120 110 T190 40"
          stroke="currentColor"
          strokeWidth="22"
          strokeLinecap="round"
        />
      </svg>
      <svg
        aria-hidden
        className="absolute -bottom-10 -right-8 h-28 w-28 text-accent/30"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M10 40 Q70 120 130 70 T190 150"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
        />
      </svg>

      <p className="relative font-serif text-base tracking-wide text-accent-dark">
        КРАСА
        <br />У ТВОЇХ РУКАХ
      </p>
    </div>
  );
}
