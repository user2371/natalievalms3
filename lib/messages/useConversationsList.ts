"use client";

import { useEffect, useState } from "react";
import { listConversationsAction } from "@/modules/messages";
import type { ConversationListItem } from "@/modules/messages";

/**
 * `lib/messages/useConversationsList.ts` — ФАЗА MSG+, задача MSG+.7.2
 * (редизайн `/messages` під спліт-в'ю макет `chatMockup.png`, за прямим
 * проханням користувача, 07.09.2026).
 *
 * Точна копія логіки завантаження, що раніше жила прямо в
 * `app/messages/page.tsx` (MSG+.3.1) — винесена в окремий хук, бо тепер її
 * потребують ОБИДВІ сторінки (`/messages` і `/messages/[conversationId]`,
 * MSG+.7.6/.7.7): у спліт-в'ю список розмов завжди видимий зліва,
 * незалежно від того, яка розмова відкрита справа. Поведінка не змінена —
 * той самий "легкий" підхід без Realtime-підписки на цьому рівні
 * (оновлення лише при поверненні на вкладку, `visibilitychange`), той
 * самий принцип мінімальної складності, що вже задокументований у
 * MSG+.2.4.
 */
export function useConversationsList(userId: string | undefined) {
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
    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  return conversations;
}
