"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { unreadTotalSet } from "@/lib/store/slices/messagesSlice";
import { listConversationsAction } from "@/modules/messages";

/**
 * `lib/realtime/useUnreadMessagesCount.ts` — ФАЗА MSG+, задача MSG+.2.4
 * (03.09.2026, частково). План MSG+.2.4 передбачає легкий поллінг (раз на
 * 30–60с) для лічильника непрочитаних, БЕЗ окремого Realtime-підключення
 * до кожної розмови одразу (те підключення — `useConversationRealtime`,
 * MSG+.2.3, лише для ВІДКРИТОЇ розмови) — цей хук саме такий поллінг:
 * бере `listConversationsAction` (той самий виклик, що вже підживлює
 * список розмов MSG+.3.1) і рахує суму `unreadCount` по всіх розмовах.
 *
 * Точки виводу бейджа (усі читають `useAppSelector((s) =>
 * s.messages.unreadTotal)`, самі НЕ викликають цей хук — щоб не було
 * двох незалежних поллінгів одночасно):
 * - `AccountSidebar`/`AccountMobileNav` — на пункті "Повідомлення"
 *   (MSG+.2.4/.3.1, 03.09.2026);
 * - `AccountButton` у `Header` — біля імені користувача, на будь-якій
 *   сторінці (MSG+.8.1, 08.09.2026, за прямим проханням користувача).
 *
 * Монтується ОДИН раз, високо в дереві — `UnreadMessagesPoller`
 * (`components/messages/UnreadMessagesPoller.tsx`, MSG+.8.1) в
 * `app/layout.tsx`, поруч із `SessionProvider`/`ProgressSyncToast` — не
 * в самому бейджі, щоб поллінг не зупинявся/не рестартував при
 * переходах між сторінками, де конкретний бейдж, можливо, взагалі не
 * рендериться.
 */
const POLL_INTERVAL_MS = 45_000;

export function useUnreadMessagesCount(enabled: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function poll() {
      const result = await listConversationsAction();
      if (cancelled || !result.success) return;
      const total = result.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      dispatch(unreadTotalSet(total));
    }

    void poll();
    const timer = setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [enabled, dispatch]);

  return useAppSelector((state) => state.messages.unreadTotal);
}
