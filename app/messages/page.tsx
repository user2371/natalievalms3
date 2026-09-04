"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { GuestGate } from "@/components/account/GuestGate";
import { AccountPageSkeleton } from "@/components/skeletons/AccountPageSkeleton";
import { Avatar } from "@/components/ui/Avatar";
import { ChatIcon } from "@/components/ui/icons";
import { listConversationsAction } from "@/modules/messages";
import type { ConversationListItem, MessageParticipant } from "@/modules/messages";

export const dynamic = "force-dynamic";

/**
 * `app/messages/page.tsx` — ФАЗА MSG+, задача MSG+.3.1 (03.09.2026, за
 * прямим проханням користувача — "бери msg+3"). Список розмов поточного
 * користувача, той самий каркас `AccountLayout`, що вже на `/homework`/
 * `/my-learning`/`/certificates` — `/messages` тепер повноцінний пункт
 * кабінету (`ACCOUNT_NAV_ITEMS`, `components/account/AccountSidebar.tsx`).
 *
 * Дані — `listConversationsAction` (`modules/messages`, MSG+.1, уже готовий
 * з MSG+.1 — тут лише UI). Realtime (MSG+.2.3) підключено НЕ на цьому
 * екрані (тут не відкрита конкретна розмова) — список оновлюється при
 * фокусі вкладки (`visibilitychange`), той самий легкий підхід, що вже
 * `useUnreadMessagesCount` (MSG+.2.4, поллінг, не веб-сокет на кожну
 * розмову одразу).
 */
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

/** Той самий підхід, що `DATE_FORMATTER` в `CommentCard.tsx` — короткий формат для списку розмов (година:хвилина сьогодні, інакше "3 вер"). */
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
}: {
  conversation: ConversationListItem;
  currentUserId: string;
}) {
  const { otherParticipant, lastMessage, unreadCount } = conversation;
  const timestamp = lastMessage?.createdAt ?? conversation.createdAt;
  const preview = lastMessage
    ? `${lastMessage.senderId === currentUserId ? "Ви: " : ""}${lastMessage.body}`
    : "Розмову ще не розпочато";

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-cream-soft"
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

/**
 * Порожній стан (MSG+.3.4) — той самий стиль пунктирної рамки, що вже
 * `ProfileEmptyState` (`app/users/[id]/page.tsx`).
 */
function MessagesEmptyState() {
  return (
    <div className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-rose-line/60 py-14 text-center">
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

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [conversations, setConversations] = useState<ConversationListItem[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    function load() {
      listConversationsAction()
        .then((result) => {
          if (!cancelled && result.success) setConversations(result.conversations);
        })
        .catch(() => {
          if (!cancelled) setConversations([]);
        });
    }

    load();
    // Легке оновлення при поверненні на вкладку — розмова могла отримати
    // нове повідомлення, поки вкладка була неактивна; той самий принцип
    // мінімальної складності, що й у `useUnreadMessagesCount` (MSG+.2.4).
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  if (status === "unauthenticated") {
    return <GuestGate description="приватних повідомлень" />;
  }

  return (
    <AccountLayout description="приватних повідомлень">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">Повідомлення</h1>

      {conversations === null ? (
        <div className="mt-6">
          <AccountPageSkeleton rows={5} />
        </div>
      ) : conversations.length === 0 ? (
        <MessagesEmptyState />
      ) : (
        <div className="mt-5 flex flex-col divide-y divide-cream-soft rounded-2xl border border-rose-line/40 bg-white px-2">
          {conversations.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              currentUserId={userId!}
            />
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
