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
  /**
   * MSG+.8.1 (08.09.2026): той самий бейдж-число, що на пункті
   * "Повідомлення" в `AccountSidebar`/`AccountMobileNav`
   * (MSG+.2.4/.3.1) — тут прикріплений одразу після імені в Header.
   * `undefined`/`0` — бейдж не рендериться.
   */
  unreadMessagesCount?: number;
}

export function AccountButton({
  name,
  avatarUrl,
  role,
  open = false,
  onToggle,
  onLogout,
  className,
  unreadMessagesCount,
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
      {/* MSG+.8.1 — ім'я + бейдж непрочитаних згруповані в один
          прихований-на-мобільному блок (той самий `hidden sm:` поділ,
          що й раніше на самому імені): бейдж завжди йде ВІДРАЗУ ПІСЛЯ
          прізвища, тож не лишається "сиротою" без підпису на екранах,
          де саме ім'я приховане. */}
      <span className="hidden items-center gap-2 sm:flex">
        <span className="text-sm font-medium text-ink">{name}</span>
        {!!unreadMessagesCount && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white">
            {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
          </span>
        )}
      </span>
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
