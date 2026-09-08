"use client";

import { useSession } from "next-auth/react";
import { ConversationListPanel } from "@/components/messages/ConversationListPanel";
import { ChatPanel } from "@/components/messages/ChatPanel";
import { ChatIcon } from "@/components/ui/icons";
import { useConversationsList } from "@/lib/messages/useConversationsList";

export interface MessagesSplitViewProps {
  /** `undefined` — на `/messages` (без вибраної розмови). Рядок — `id` відкритої розмови (`/messages/[conversationId]`). */
  activeConversationId?: string;
}

/**
 * `components/messages/MessagesSplitView.tsx` — ФАЗА MSG+, задача MSG+.7.5
 * (редизайн `/messages` під спліт-в'ю макет `chatMockup.png`, за прямим
 * проханням користувача, 07.09.2026).
 *
 * Одна біла картка (`rounded-3xl border`, за макетом) з двома панелями
 * поруч: `ConversationListPanel` зліва (фіксована ширина на десктопі,
 * `md:w-[360px]`), `ChatPanel` справа (заповнює решту). Обидва
 * використовуються і на `/messages`, і на `/messages/[conversationId]`
 * (MSG+.7.6/.7.7) — список розмов тепер завжди видимий поруч з відкритою
 * розмовою, а не лише на окремому "порожньому" маршруті, як було в
 * MSG+.3.1/.3.2.
 *
 * Адаптив — навмисно CSS-only (`hidden md:flex`/`md:hidden`), без
 * JS-детекції ширини екрана: на мобільному видно РІВНО одну панель залежно
 * від того, чи задано `activeConversationId` (список — на `/messages`,
 * чат — на `/messages/[conversationId]`, звідки й кнопка "назад" у шапці
 * `ChatPanel` веде саме на `/messages`). На десктопі (`md:` і ширше) обидві
 * панелі видно завжди, і `/messages` без вибраної розмови показує
 * `EmptyChatPlaceholder` справа замість порожнього простору — той самий
 * порожній стан за стилем `MessagesEmptyState`/`ProfileEmptyState`, що вже
 * усталений в проєкті.
 *
 * "Хто співрозмовник" для шапки `ChatPanel` (MSG+.7.7) — знаходиться тут,
 * серед уже завантаженого `conversations` (той самий `.find(...)` за
 * `conversationId`, що раніше жив у самій сторінці, MSG+.3.2), а не
 * повторним викликом `listConversationsAction` — список і так завжди
 * завантажений цим компонентом для лівої панелі, другий запит заради
 * тих самих даних був би зайвим дублюванням мережевого виклику.
 */
export function MessagesSplitView({ activeConversationId }: MessagesSplitViewProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const conversations = useConversationsList(userId);

  const otherParticipant = !activeConversationId
    ? undefined
    : conversations === null
      ? undefined
      : (conversations.find((c) => c.id === activeConversationId)?.otherParticipant ?? null);

  return (
    <div className="flex h-[calc(100dvh-8rem)] min-h-[520px] overflow-hidden rounded-3xl border border-rose-line/40 bg-white sm:h-[calc(100dvh-9rem)]">
      <ConversationListPanel
        conversations={conversations}
        currentUserId={userId ?? ""}
        activeConversationId={activeConversationId}
        className={activeConversationId ? "hidden border-r border-rose-line/40 p-4 md:flex md:w-[360px] md:shrink-0" : "flex border-r border-rose-line/40 p-4 md:w-[360px] md:shrink-0"}
      />

      {activeConversationId ? (
        <ChatPanel
          key={activeConversationId}
          conversationId={activeConversationId}
          otherParticipant={otherParticipant}
          className="flex"
        />
      ) : (
        <EmptyChatPlaceholder />
      )}
    </div>
  );
}

/** Порожній стан правої панелі на `/messages`, поки не обрано розмову (десктоп-лише — на мобільному ця панель і так `hidden` без `activeConversationId`). */
function EmptyChatPlaceholder() {
  return (
    <div className="hidden flex-1 flex-col items-center justify-center gap-3 px-6 text-center md:flex">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
        <ChatIcon size={24} />
      </span>
      <p className="font-serif text-lg text-ink">Оберіть розмову</p>
      <p className="max-w-xs text-sm text-muted">
        Виберіть розмову зі списку зліва, щоб побачити переписку.
      </p>
    </div>
  );
}
