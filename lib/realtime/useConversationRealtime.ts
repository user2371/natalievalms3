"use client";

import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useAppDispatch } from "@/lib/store/hooks";
import {
  conversationRealtimeCacheCleared,
  realtimeMessageReceived,
} from "@/lib/store/slices/messagesSlice";
import { getRealtimeBridgeTokenAction } from "./actions";
import { getSupabaseRealtimeClient } from "./supabaseClient";
import type { Message } from "@/modules/messages";

/**
 * `lib/realtime/useConversationRealtime.ts` — ФАЗА MSG+, задача MSG+.2.3
 * (03.09.2026). Підписка на нові повідомлення КОНКРЕТНОЇ розмови — монтується
 * екраном розмови (MSG+.3.2). Не робить повного refetch списку повідомлень —
 * лише додає нове повідомлення в `messagesSlice` (Redux), яке MSG+.3.2
 * домержує з історією, підвантаженою через `listMessagesAction`.
 *
 * Токен (MSG+.2.1/.2.2) живе 60с — коротше, ніж реалістична тривалість
 * відкритого екрана розмови, тож оновлюється періодично, поки підписка
 * активна (`setAuth` на вже відкритому WebSocket-з'єднанні, БЕЗ
 * перестворення каналу — той самий канал лишається підписаним).
 *
 * Для realtime насправді потрібні ТРИ окремі речі на боці Supabase, і
 * бракувати може будь-якої з них незалежно — статус каналу "SUBSCRIBED"
 * підтверджує лише WebSocket-з'єднання, НІЧОГО з решти:
 *  1. Таблиця в публікації `supabase_realtime` (без цього Realtime
 *     нічого не відправляє, незалежно від RLS).
 *  2. `GRANT SELECT ... TO authenticated` на таблиці — RLS лише
 *     ФІЛЬТРУЄ рядки в межах уже дозволеного запиту; без базового
 *     табличного GRANT роль не має права виконати SELECT взагалі, і
 *     Postgres відмовляє ще ДО перевірки RLS-політик. Це найлегше
 *     пропустити (RLS-міграція без нього виглядає повністю коректною),
 *     і саме це було причиною багу тут 05.09.2026 — виправлено міграцією
 *     `20260905000000_messages_realtime_grants`.
 *  3. Сам `CREATE POLICY` для ролі `authenticated` (`20260903110000_
 *     messages_realtime_rls`).
 * Перевірити фактичну реєстрацію підписки на сервері можна запитом
 * `select * from realtime.subscription;` в Supabase SQL Editor, поки
 * канал відкритий — порожній результат при статусі "SUBSCRIBED" на
 * клієнті означає, що бракує (2) або (3).
 */
const TOKEN_REFRESH_INTERVAL_MS = 40_000;

export function useConversationRealtime(conversationId: string | null | undefined) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let cancelled = false;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    // MSG+.2.3 (виправлено 04.09.2026): "тиха відмова" для ВІДСУТНІХ
    // env-змінних (`NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`) — без цього
    // `getSupabaseRealtimeClient()` кидала виняток синхронно прямо тут,
    // необроблений виняток валив увесь рендер екрана розмови (Next.js
    // "Runtime Error"), хоча задум хука — "realtime не критичний, історія
    // й так довантажується окремо" (`listMessagesAction`).
    let client: SupabaseClient;
    try {
      client = getSupabaseRealtimeClient();
    } catch (err) {
      console.warn(
        "MSG+.2.3: Realtime недоступний (env не налаштовано) — розмова працюватиме без live-оновлень",
        err instanceof Error ? err.message : err,
      );
      return;
    }

    async function authorize(): Promise<boolean> {
      const result = await getRealtimeBridgeTokenAction();
      if (!result.success || !result.token) {
        // Мовчазна відмова — без блокуючого UI-повідомлення: той самий
        // принцип, що вже в `verifyPostRegistrationToken` (`authorize()`,
        // `auth.ts`) — недійсний/недоступний токен тут означає лише
        // тимчасову відсутність realtime-оновлень, НЕ зламаний UI (історія
        // розмови й так довантажується окремо через `listMessagesAction`).
        console.error("MSG+.2.3: не вдалося отримати realtime-токен", result.error);
        return false;
      }
      client.realtime.setAuth(result.token);
      return true;
    }

    // MSG+.2.3 (виправлено 04.09.2026, друге виправлення): `setAuth()`
    // МАЄ відбутись ДО `.subscribe()`. Postgres Changes перевіряють
    // авторизацію САМЕ в момент підписки на канал — токен, виставлений
    // вже ПІСЛЯ події "SUBSCRIBED" (як було раніше), не переавторизовує
    // вже встановлену підписку заднім числом (на відміну від broadcast/
    // presence).
    function subscribeChannel() {
      const ch = client
        .channel(`conversation:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "Message",
            filter: `conversationId=eq.${conversationId}`,
          },
          (payload) => {
            if (cancelled) return;
            // ТИМЧАСОВИЙ діагностичний лог — прибрати після підтвердження.
            console.log("MSG+.2.3 debug: отримано postgres_changes INSERT " + JSON.stringify(payload));
            const row = payload.new as {
              id: string;
              conversationId: string;
              senderId: string | null;
              senderLabel: string | null;
              body: string;
              createdAt: string;
            };
            // Realtime-подія несе лише сирий рядок `Message` (без `sender`-
            // релейшну, який додає `modules/messages/repository.ts` для
            // серверного `listMessages`) — `sender: null` тут навмисно;
            // `messagesSlice`/UI (MSG+.3.2) резолвить автора з уже відомих
            // даних розмови (список учасників довантажений раніше), а не
            // чекає на другий round-trip лише заради аватара/ніка.
            const message: Message = {
              id: row.id,
              conversationId: row.conversationId,
              senderId: row.senderId,
              senderLabel: row.senderLabel,
              body: row.body,
              createdAt: new Date(row.createdAt),
              sender: null,
            };
            dispatch(realtimeMessageReceived({ conversationId, message }));
          },
        )
        .subscribe((status, err) => {
          // ТИМЧАСОВИЙ діагностичний лог — прибрати після підтвердження.
          console.log(
            "MSG+.2.3 debug: статус каналу " +
              JSON.stringify({ conversationId, status, err: err instanceof Error ? err.message : err }),
          );
        });
      return ch;
    }

    let channel: ReturnType<typeof subscribeChannel> | null = null;

    void (async () => {
      // Перший `setAuth()` — синхронно перед підпискою, не в колбеку
      // статусу. Якщо токен не вдалось отримати, підписуємось все одно
      // (той самий "тихий" принцип вище) — просто без live-оновлень,
      // допоки не спрацює `refreshTimer`.
      await authorize();
      if (cancelled) return;
      channel = subscribeChannel();
    })();

    refreshTimer = setInterval(() => {
      void authorize();
    }, TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (refreshTimer) clearInterval(refreshTimer);
      if (channel) void client.removeChannel(channel);
      dispatch(conversationRealtimeCacheCleared({ conversationId }));
    };
  }, [conversationId, dispatch]);
}
