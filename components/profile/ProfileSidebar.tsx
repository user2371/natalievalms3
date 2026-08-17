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
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface ProfileSidebarProps {
  onLogout?: () => void;
  className?: string;
}

const NAV_ITEMS = [
  { label: "Мій профіль", href: "/profile", icon: UserIcon },
  { label: "Моє навчання", href: "/my-learning", icon: GraduationCapIcon },
  { label: "Домашні завдання", href: "/profile#homework", icon: UploadIcon },
  { label: "Сертифікати", href: "/certificates", icon: DiplomaIcon },
  { label: "Налаштування", href: "/settings", icon: GearIcon },
];

/**
 * Бічна навігація кабінету користувача, за мокапом `ProfilePage.png`.
 * Спільна для `/profile` і (в майбутньому) `/my-learning`, `/settings`,
 * `/certificates` — коли ці сторінки з'являться, підключать той самий
 * компонент. Активний пункт визначається за поточним шляхом (`usePathname`).
 */
export function ProfileSidebar({ onLogout, className }: ProfileSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)} aria-label="Навігація кабінету">
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
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
          </Link>
        );
      })}

      <button
        type="button"
        onClick={onLogout}
        className="mt-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-ink/80 transition-colors hover:bg-cream-soft"
      >
        <LogoutIcon size={18} className="text-muted" />
        Вийти
      </button>
    </nav>
  );
}
