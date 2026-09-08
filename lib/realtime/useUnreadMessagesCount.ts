"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { unreadTotalSet } from "@/lib/store/slices/messagesSlice";
import { listConversationsAction } from "@/modules/messages";

/**
 * `lib/realtime/useUnreadMessagesCount.ts` — ФАЗА MSG+, задача MSG+.2.4
 * (03.09.2026, частково). План MSG+.2.4 передбачає легкий поллінг для
 * лічильника непрочитаних, БЕЗ окремого Realtime-підключення до кожної
 * розмови одразу (те підключення — `useConversationRealtime`,
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
 *
 * MSG+.8.2 (08.09.2026, за прямим проханням користувача — навантаження
 * поллінгу на безкоштовний тариф Supabase, після того як MSG+.8.1
 * поширив бейдж/поллінг з "лише сторінок кабінету" на буквально КОЖНУ
 * сторінку): дві незалежні зміни поверх самого поллінгу (третя —
 * усунення N+1 у запиті — в `modules/messages/repository.ts`,
 * `listConversationsForUser`):
 * 1. **Пауза на неактивній вкладці** (`document.visibilitychange`) —
 *    поллінг зупиняється, щойно вкладка йде у фон (`document.hidden`),
 *    і відновлюється (з негайним одним запитом, щоб число не було
 *    застарілим) при поверненні у фокус. Більшість відкритих вкладок
 *    у звичайного користувача — фонові, тож це найдешевший спосіб
 *    різко скоротити фактичну кількість запитів без втрати свіжості
 *    даних, коли вкладка реально переглядається.
 * 2. **Інтервал 45с → 150с** (`POLL_INTERVAL_MS`) — той самий поллінг,
 *    рідше; для лічильника непрочитаних (не критично-реалтаймова
 *    штука — саме повідомлення в ВІДКРИТІЙ розмові й так летять миттєво
 *    через `useConversationRealtime`, MSG+.2.3, це лише сумарний бейдж)
 *    затримка в межах пари хвилин непомітна користувачу.
 */
const POLL_INTERVAL_MS = 150_000;

export function useUnreadMessagesCount(enabled: boolean) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function poll() {
      const result = await listConversationsAction();
      if (cancelled || !result.success) return;
      const total = result.conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      dispatch(unreadTotalSet(total));
    }

    function start() {
      if (timer) return;
      void poll();
      timer = setInterval(() => {
        void poll();
      }, POLL_INTERVAL_MS);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") {
      start();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, dispatch]);

  return useAppSelector((state) => state.messages.unreadTotal);
}
