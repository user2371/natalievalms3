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
 * `lib/realtime/useConversationRealtime.ts` — ФАЗА MSG+, задача MSG+.2.3.
 * Підписка на нові повідомлення КОНКРЕТНОЇ розмови — монтується екраном
 * розмови (MSG+.3.2). Не робить повного refetch списку повідомлень — лише
 * додає нове повідомлення в `messagesSlice` (Redux), яке MSG+.3.2 домержує
 * з історією, підвантаженою через `listMessagesAction`.
 *
 * (06.09.2026) ПЕРЕХІД З `postgres_changes` НА "BROADCAST FROM DATABASE" —
 * офіційно рекомендований Supabase підхід (postgres_changes сам документовано
 * як "простіший, але гірше масштабується"). Причина переходу: після
 * вичерпної діагностики (публікація/GRANT/RLS/підписка/слоти реплікації —
 * все підтверджено коректним) `postgres_changes`-події для "Message" так і
 * не доходили до жодного клієнта на цьому проєкті — навіть з роллю
 * `postgres` в Realtime Inspector. `pg_stat_replication` показав лише ОДНЕ
 * живе стрім-з'єднання (`pgoutput`), а `postgres_changes` для наших таблиць
 * ішов через окремий `wal2json`-слот, який утримувався процесом
 * `realtime_rls` через періодичні (не безперервні) виклики — і з якоїсь
 * причини на боці інфраструктури Supabase (поза межами цього проєкту)
 * не завершував доставку. Механізм нижче (тригер `broadcast_message_
 * changes` з міграції `20260906000000_messages_broadcast_from_db`, що явно
 * пише в `realtime.messages`) використовує той самий канал, який
 * підтверджено ЖИВИМ і робочим в цьому проєкті.
 *
 * Токен (MSG+.2.1/.2.2) живе 60с — коротше, ніж реалістична тривалість
 * відкритого екрана розмови, тож оновлюється періодично. Для приватних
 * (`private: true`) каналів Broadcast-авторизація перевіряється саме в
 * момент `.subscribe()` (як і в postgres_changes) — тому канал так само
 * пересоздається при оновленні токена, а не просто викликає `setAuth` на
 * вже підписаному каналі.
 */
const TOKEN_REFRESH_INTERVAL_MS = 40_000;

// Форма запису, яку кладе `realtime.broadcast_changes()` в поле `record`/
// `old_record` (сирий рядок `"Message"`, без `sender`-релейшну — те саме,
// що раніше приходило в `payload.new` для postgres_changes).
type BroadcastMessageRecord = {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderLabel: string | null;
  body: string;
  // MSG+.7.8 (07.09.2026) — сирий рядок "Message" з тригера
  // (`broadcast_message_changes`, міграція `20260906000000_messages_
  // broadcast_from_db`) несе ВЕСЬ рядок таблиці, тож нове поле
  // з'являється тут само собою без зміни самого тригера/SQL — лише
  // тип нижче потребує оновлення, щоб TypeScript знав про нього.
  imageUrl: string | null;
  createdAt: string;
};

export function useConversationRealtime(conversationId: string | null | undefined) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!conversationId) {
      return;
    }
    // TypeScript не звужує тип параметра всередині вкладених замикань
    // (callback у `.on(...)`, async IIFE нижче) — фіксуємо звужене
    // значення в `const`, щоб там був гарантований `string`, а не
    // `string | null | undefined`.
    const activeConversationId = conversationId;

    let cancelled = false;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    // "Тиха відмова" для ВІДСУТНІХ env-змінних (`NEXT_PUBLIC_SUPABASE_URL`/
    // `_ANON_KEY`) — без цього `getSupabaseRealtimeClient()` кидала виняток
    // синхронно прямо тут, необроблений виняток валив увесь рендер екрана
    // розмови (Next.js "Runtime Error"), хоча задум хука — "realtime не
    // критичний, історія й так довантажується окремо" (`listMessagesAction`).
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

    // Приватний Broadcast-канал: `config: { private: true }` вмикає
    // Realtime Authorization (RLS-перевірку на `realtime.messages` —
    // політика `participant_receives_conversation_broadcast`, міграція
    // `20260906000000_messages_broadcast_from_db`) замість дозволу всім.
    function subscribeChannel() {
      const ch = client
        .channel(`conversation:${activeConversationId}`, {
          config: { private: true },
        })
        .on(
          "broadcast",
          { event: "INSERT" },
          (payload: { payload: { record: BroadcastMessageRecord } }) => {
            if (cancelled) return;
            const row = payload.payload.record;
            // Broadcast-подія несе лише сирий рядок `Message` (без `sender`-
            // релейшну, який додає `modules/messages/repository.ts` для
            // серверного `listMessages`) — `sender: null` тут навмисно;
            // `messagesSlice`/UI (MSG+.3.2) резолвить автора з уже відомих
            // даних розмови (список учасників довантажений раніше), а не
            // чекає на другий round-trip лише заради аватара/ніка.
            //
            // `createdAt` лишається РЯДКОМ (не `new Date(...)`) — Redux
            // (`messagesSlice`) вимагає серіалізовні значення в actions;
            // конвертація в `Date` відбувається в `page.tsx` при
            // домерджуванні цього повідомлення в локальний `useState`.
            const message = {
              id: row.id,
              conversationId: row.conversationId,
              senderId: row.senderId,
              senderLabel: row.senderLabel,
              body: row.body,
              imageUrl: row.imageUrl,
              createdAt: row.createdAt,
              sender: null,
            };
            dispatch(realtimeMessageReceived({ conversationId: activeConversationId, message }));
          },
        )
        .subscribe();
      return ch;
    }

    let channel: ReturnType<typeof subscribeChannel> | null = null;

    void (async () => {
      // `setAuth()` — синхронно перед підпискою, не після. Для приватних
      // каналів авторизація перевіряється саме в момент `.subscribe()`.
      await authorize();
      if (cancelled) return;
      channel = subscribeChannel();
    })();

    refreshTimer = setInterval(() => {
      void (async () => {
        const ok = await authorize();
        if (ok && !cancelled) {
          // Для приватних каналів оновлений токен враховується лише при
          // новому `.subscribe()` — просто `setAuth` на вже підписаному
          // каналі недостатньо (авторизація приватного каналу — це
          // одноразова перевірка при вході, а не постійний стан).
          if (channel) void client.removeChannel(channel);
          channel = subscribeChannel();
        }
      })();
    }, TOKEN_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (refreshTimer) clearInterval(refreshTimer);
      if (channel) void client.removeChannel(channel);
      dispatch(conversationRealtimeCacheCleared({ conversationId: activeConversationId }));
    };
  }, [conversationId, dispatch]);
}
