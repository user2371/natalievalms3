"use client";

import { useSession } from "next-auth/react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { GuestGate } from "@/components/account/GuestGate";
import { MessagesSplitView } from "@/components/messages/MessagesSplitView";

export const dynamic = "force-dynamic";

/**
 * `app/messages/page.tsx` — ФАЗА MSG+, задача MSG+.7.6 (редизайн `/messages`
 * під спліт-в'ю макет `chatMockup.png`, за прямим проханням користувача,
 * 07.09.2026).
 *
 * Замінює колишній список-лише-екран (MSG+.3.1): весь UI тепер у
 * `MessagesSplitView` (список розмов + права панель чату в одній картці,
 * за макетом) — ця сторінка лише монтує `AccountLayout` (той самий каркас,
 * що й раніше) і рендерить спліт-в'ю БЕЗ `activeConversationId` (розмову
 * ще не обрано — на десктопі справа `EmptyChatPlaceholder`, на мобільному
 * видно лише список, той самий адаптив, що вже описаний у
 * `MessagesSplitView`).
 */
export default function MessagesPage() {
  const { status } = useSession();

  if (status === "unauthenticated") {
    return <GuestGate description="приватних повідомлень" />;
  }

  return (
    <AccountLayout description="приватних повідомлень">
      <MessagesSplitView />
    </AccountLayout>
  );
}
