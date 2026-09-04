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
 * ⚠️ Відкрите: сама точка виводу бейджа в навігації (Header/AccountButton)
 * НЕ підключена в цій задачі — навмисно. У проєкті ще НЕМАЄ пункту меню
 * "Повідомлення" (немає ні `/messages`-маршруту, ні посилання на нього
 * в `Header.tsx`/`AccountDropdown.tsx` — MSG+.3, наступна фаза), тож
 * "бейдж поруч із наявними" (points/leaderboard) нема куди фізично
 * прикріпити без вигаданого нового пункту меню, який належить MSG+.3.1,
 * а не сюди. Хук + `messagesSlice.unreadTotal` готові вже зараз —
 * `useAppSelector((s) => s.messages.unreadTotal)` в будь-якому компоненті;
 * саму навігаційну кнопку/бейдж підключить MSG+.3.1 разом зі сторінкою
 * `/messages`, той самий порядок "дані наперед, UI останнім", що вже
 * в CERT+/F.21.
 *
 * Монтується один раз, високо в дереві (напр. поруч з `SessionProvider`,
 * `app/layout.tsx`) — не в самому бейджі, щоб поллінг не зупинявся/не
 * рестартував при переходах між сторінками, де бейдж, можливо, взагалі
 * не рендериться.
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
