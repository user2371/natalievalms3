import Link from "next/link";
import { GearIcon, GraduationCapIcon, UserIcon } from "@/components/ui/icons";

export interface AccountDropdownProps {
  onNavigate?: () => void;
}

const MENU_ITEMS = [
  { label: "Мій профіль", href: "/profile", icon: UserIcon },
  { label: "Моє навчання", href: "/my-learning", icon: GraduationCapIcon },
];

const MENU_ITEMS_SECONDARY = [
  { label: "Налаштування", href: "/settings", icon: GearIcon },
];

export function AccountDropdown({ onNavigate }: AccountDropdownProps) {
  return (
    <div role="menu" aria-label="Меню акаунту">
      <div className="flex flex-col gap-0.5">
        {MENU_ITEMS.map(({ label, href, icon: Icon }) => (
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
