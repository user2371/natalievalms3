"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountPageSkeleton } from "@/components/skeletons/AccountPageSkeleton";
import { Avatar } from "@/components/ui/Avatar";
import { ChatIcon, SearchIcon } from "@/components/ui/icons";
import type { ConversationListItem, MessageParticipant } from "@/modules/messages";
import { cn } from "@/lib/utils";

/** Той самий `displayName`, що вже в `ChatPanel.tsx`/старому `[conversationId]/page.tsx` — локальна копія, не спільна утиліта (усталений принцип проєкту, див. коментар у `ChatPanel.tsx`). */
function displayName(participant: MessageParticipant | null): string {
  if (!participant) return "Видалений користувач";
  if (participant.nickname) return participant.nickname;
  return `${participant.firstName}${participant.lastName ? ` ${participant.lastName}` : ""}`;
}

const TIME_FORMATTER_TODAY = new Intl.DateTimeFormat("uk-UA", {
  hour: "2-digit",
  minute: "2-digit",
});
const TIME_FORMATTER_OTHER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
});

function formatConversationTime(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  return isToday ? TIME_FORMATTER_TODAY.format(date) : TIME_FORMATTER_OTHER.format(date);
}

function ConversationRow({
  conversation,
  currentUserId,
  active,
}: {
  conversation: ConversationListItem;
  currentUserId: string;
  active: boolean;
}) {
  const { otherParticipant, lastMessage, unreadCount } = conversation;
  const timestamp = lastMessage?.createdAt ?? conversation.createdAt;
  const preview = lastMessage
    ? `${lastMessage.senderId === currentUserId ? "Ви: " : ""}${lastMessage.body}`
    : "Розмову ще не розпочато";

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-cream-soft",
        active && "bg-cream-soft",
      )}
    >
      <Avatar name={displayName(otherParticipant)} src={otherParticipant?.avatarUrl} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p
            className={
              unreadCount > 0
                ? "truncate text-sm font-semibold text-ink"
                : "truncate text-sm font-medium text-ink"
            }
          >
            {displayName(otherParticipant)}
          </p>
          <span className="shrink-0 text-xs text-muted">
            {formatConversationTime(new Date(timestamp))}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={
              unreadCount > 0
                ? "truncate text-sm font-medium text-ink/90"
                : "truncate text-sm text-muted"
            }
          >
            {preview}
          </p>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Той самий порожній стан, що раніше в `app/messages/page.tsx` (MSG+.3.4) — без змін. */
function MessagesEmptyState() {
  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-rose-line/60 px-4 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
        <ChatIcon size={22} />
      </span>
      <p className="font-serif text-lg text-ink">Поки немає розмов</p>
      <p className="max-w-xs text-sm text-muted">
        Напишіть комусь із таблиці лідерів або зі сторінки профілю — розмова зʼявиться тут.
      </p>
    </div>
  );
}

export interface ConversationListPanelProps {
  conversations: ConversationListItem[] | null;
  currentUserId: string;
  activeConversationId?: string;
  /** Приховує панель на мобільному, коли якась розмова вже відкрита справа (MSG+.7.4/.7.5 — адаптив спліт-в'ю без JS-медіа-запитів, лише класи `hidden md:flex`). */
  className?: string;
}

/**
 * `components/messages/ConversationListPanel.tsx` — ФАЗА MSG+, задача
 * MSG+.7.3 (редизайн `/messages` під спліт-в'ю макет `chatMockup.png`, за
 * прямим проханням користувача, 07.09.2026).
 *
 * Той самий список розмов, що раніше рендерився напряму в
 * `app/messages/page.tsx` (MSG+.3.1) — винесено в окремий компонент, бо
 * тепер він завжди видимий поруч з відкритою розмовою (`MessagesSplitView`,
 * MSG+.7.5), а не лише на окремому маршруті без вибраної розмови.
 *
 * Нове порівняно з MSG+.3.1: поле пошуку зверху (за макетом) — клієнтський
 * фільтр по ІМЕНІ співрозмовника, БЕЗ нового server action (увесь список
 * і так завантажений через `listConversationsAction`, фільтрація тексту
 * серед уже наявних кількох десятків розмов користувача не потребує
 * запиту до бази — той самий принцип, що вже "Показати ще" в
 * `RealCommentsBlock.tsx`: не ускладнювати там, де вистачає найпростішого
 * клієнтського рішення). `activeConversationId` підсвічує поточну
 * розмову фоном `bg-cream-soft` (за макетом).
 */
export function ConversationListPanel({
  conversations,
  currentUserId,
  activeConversationId,
  className,
}: ConversationListPanelProps) {
  const [query, setQuery] = useState("");

  const filtered =
    conversations && query.trim()
      ? conversations.filter((c) =>
          displayName(c.otherParticipant).toLowerCase().includes(query.trim().toLowerCase()),
        )
      : conversations;

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div className="flex items-center justify-between px-1">
        <h1 className="font-serif text-2xl text-ink">Повідомлення</h1>
      </div>

      <label className="relative mt-4 block px-1">
        <SearchIcon
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Пошук"
          aria-label="Пошук розмов за іменем"
          className="w-full rounded-full border border-rose-line/50 bg-cream-soft/60 py-2.5 pl-11 pr-4 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </label>

      {conversations === null ? (
        <div className="mt-5 px-1">
          <AccountPageSkeleton rows={5} />
        </div>
      ) : conversations.length === 0 ? (
        <MessagesEmptyState />
      ) : (
        <div className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
          {filtered && filtered.length === 0 && (
            <p className="mt-6 text-center text-sm text-muted">Нічого не знайдено</p>
          )}
          {filtered?.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              currentUserId={currentUserId}
              active={conversation.id === activeConversationId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
