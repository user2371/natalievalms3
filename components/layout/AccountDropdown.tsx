import Link from "next/link";
import { GearIcon, GraduationCapIcon, ShieldIcon, UserIcon } from "@/components/ui/icons";

export interface AccountDropdownProps {
  onNavigate?: () => void;
  /** F.27.1: коли `true` — після "Моє навчання" зʼявляється пункт "Панель адміністратора". */
  isAdmin?: boolean;
}

const BASE_MENU_ITEMS = [
  { label: "Мій профіль", href: "/profile", icon: UserIcon },
  { label: "Моє навчання", href: "/my-learning", icon: GraduationCapIcon },
];

/** F.27.1: той самий `ShieldIcon`, що вже позначає адмін-модерацію в `CommentCard.tsx`/`AdminUsersTable.tsx`. */
const ADMIN_MENU_ITEM = {
  label: "Панель адміністратора",
  href: "/admin",
  icon: ShieldIcon,
};

const MENU_ITEMS_SECONDARY = [
  { label: "Налаштування", href: "/settings", icon: GearIcon },
];

/**
 * F.27.1: пункт меню акаунту для адміна. `MENU_ITEMS` тепер будується
 * динамічно (не статичний масив) — залежить від `isAdmin`, переданого з
 * `Header.tsx` (F.27.2), яке саме читає `session.user.role`.
 */
export function AccountDropdown({ onNavigate, isAdmin = false }: AccountDropdownProps) {
  const menuItems = isAdmin ? [...BASE_MENU_ITEMS, ADMIN_MENU_ITEM] : BASE_MENU_ITEMS;

  return (
    <div role="menu" aria-label="Меню акаунту">
      <div className="flex flex-col gap-0.5">
        {menuItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            role="menuitem"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-cream-soft"
          >
            <Icon size={18} className="text-accent" />
            {label}
          </Link>
        ))}
      </div>
      <div className="my-1.5 h-px bg-rose-line/40" />
      <div className="flex flex-col gap-0.5">
        {MENU_ITEMS_SECONDARY.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            role="menuitem"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-cream-soft"
          >
            <Icon size={18} className="text-accent" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
