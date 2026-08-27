"use client";

import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { ChevronDownIcon, ChevronUpIcon, LogoutIcon } from "@/components/ui/icons";

export interface AccountButtonProps {
  name: string;
  avatarUrl?: string | null;
  /** F.27.4: прокидається в `Avatar` — бейдж "M" на власному аватарі в Header. */
  role?: string;
  open?: boolean;
  onToggle?: () => void;
  onLogout?: (e: React.MouseEvent) => void;
  className?: string;
}

export function AccountButton({
  name,
  avatarUrl,
  role,
  open = false,
  onToggle,
  onLogout,
  className,
}: AccountButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={cn(
        "flex items-center gap-2 rounded-full border bg-white pl-1.5 pr-3 py-1.5 transition-colors",
        open ? "border-accent" : "border-rose-line/40 hover:border-accent/60",
        className,
      )}
    >
      <Avatar name={name} src={avatarUrl} size={32} role={role} />
      <span className="hidden text-sm font-medium text-ink sm:inline">{name}</span>
      {open ? (
        <ChevronUpIcon size={16} className="text-accent-dark" />
      ) : (
        <ChevronDownIcon size={16} className="text-muted" />
      )}
      {onLogout && (
        <>
          <span className="hidden h-4 w-px bg-rose-line/60 sm:block" aria-hidden />
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onLogout(e);
            }}
            className="hidden items-center gap-1 text-sm text-accent-dark hover:text-accent-dark/80 sm:inline-flex"
          >
            Вихід
            <LogoutIcon size={15} />
          </span>
        </>
      )}
    </button>
  );
}
