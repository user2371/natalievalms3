import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * `lib/realtime/supabaseClient.ts` — ФАЗА MSG+, задача MSG+.2.1 (03.09.2026).
 *
 * ЛИШЕ для Realtime-підписки (Postgres Changes на `Message`, MSG+.2.3) —
 * НЕ для Supabase Auth і НЕ для запитів через PostgREST/`supabase.from()`.
 * Уся реальна робота з даними (читання/запис повідомлень) і далі йде
 * через наявні server actions (`modules/messages/*`, Prisma) — той самий
 * принцип "один шлях до БД", що вже в `CLAUDE.md` ("Архітектура модулів").
 * Це навмисно ІНШИЙ клієнт, ніж будь-який умовний "supabase-admin" на
 * сервері — тут лише публічний `anon`-ключ, призначений для браузера;
 * приватність розмов забезпечує RLS (`prisma/migrations/
 * 20260903110000_messages_realtime_rls/`) + міст-токен
 * (`lib/realtime/supabaseRealtimeToken.ts`), а не секретність цього ключа.
 *
 * Один інстанс на вкладку (модульний singleton, не новий клієнт на
 * кожен виклик хука) — уникає зайвих WebSocket-з'єднань, якщо кілька
 * компонентів одночасно використовують `useConversationRealtime`
 * (MSG+.2.3) для різних розмов.
 */
let browserClient: SupabaseClient | null = null;

export function getSupabaseRealtimeClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY не налаштовано");
  }

  browserClient = createClient(url, anonKey, {
    // Своя (Auth.js) сесія вже керує логіном/токенами застосунку —
    // Supabase-клієнт тут не повинен лізти в localStorage/автологін.
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return browserClient;
}
