-- ФАЗА MSG+, задача MSG+.2.3 (06.09.2026) — перехід з `postgres_changes` на
-- офіційно рекомендований Supabase підхід "Broadcast from Database".
--
-- ПРИЧИНА ПЕРЕХОДУ: після вичерпної діагностики (публікація supabase_realtime
-- містить "Message", GRANT SELECT видано, RLS-політики коректні,
-- `realtime.subscription` реєструє підписки, `pg_replication_slots` активні
-- й прогресують, `realtime_rls`-процес живий і опитує WAL) INSERT-події в
-- "Message" так і не доходили до жодного клієнта через `postgres_changes`
-- — навіть з роллю `postgres` в Realtime Inspector, навіть з прямим SQL
-- INSERT в обхід застосунку. `pg_stat_replication` показав лише ОДНЕ живе
-- стрім-з'єднання (`pgoutput`), тоді як `postgres_changes` для наших
-- користувацьких таблиць консьюмиться через слот `wal2json`
-- (`supabase_realtime_replication_slot_...`), який утримується процесом
-- `realtime_rls` через періодичні виклики (не класичний streaming),
-- і з невідомої причини (на боці інфраструктури Supabase, поза межами
-- нашого проєкту) не завершує доставку до WebSocket-клієнтів.
--
-- Broadcast from Database — рекомендований Supabase спосіб saме для
-- продакшену (офіційно: "This is the recommended method for scalability
-- and security" — postgres_changes названо простішим, але менш
-- масштабованим). Замість пасивного читання WAL з подальшою RLS-
-- перевіркою на КОЖЕН рядок для КОЖНОГО підписника (як postgres_changes),
-- тригер явно publish'ить подію в `realtime.messages` — той самий
-- внутрішній механізм, який ми підтвердили ЖИВИМ і робочим в цьому
-- проєкті (активне `pgoutput`-стрім-з'єднання, pid підтверджений через
-- `pg_stat_replication`).
--
-- ⚠️ Той самий відомий виняток пісочниці — `prisma migrate dev`
-- недоступний без мережі, тому цей файл написано вручну й має бути
-- застосований напряму через Supabase SQL Editor.

-- 1. Функція-тригер: на кожен INSERT в "Message" публікує подію в
--    realtime.messages через офіційний хелпер realtime.broadcast_changes().
--    Топік — "conversation:<id>", той самий формат, що вже використовує
--    клієнтський канал (`conversation:${conversationId}` в
--    `useConversationRealtime.ts`).
create or replace function public.broadcast_message_changes()
returns trigger
security definer
language plpgsql
as $$
begin
  perform realtime.broadcast_changes(
    'conversation:' || coalesce(NEW."conversationId", OLD."conversationId")::text, -- topic
    TG_OP,                                                                        -- event
    TG_OP,                                                                        -- operation
    TG_TABLE_NAME,                                                                -- table
    TG_TABLE_SCHEMA,                                                              -- schema
    NEW,                                                                          -- new record
    OLD                                                                           -- old record
  );
  return null;
end;
$$;

-- 2. Сам тригер — лише INSERT (те, що реально потрібно зараз; UPDATE/DELETE
--    повідомлень не транслюємо, бо клієнт наразі їх не редагує/не видаляє).
drop trigger if exists message_broadcast_changes_trigger on public."Message";
create trigger message_broadcast_changes_trigger
after insert on public."Message"
for each row
execute function public.broadcast_message_changes();

-- 3. RLS-авторизація для отримання broadcast-повідомлень з приватного
--    каналу — це ОКРЕМА система від RLS на самій таблиці "Message":
--    Realtime перевіряє право читати з ТОПІКУ через політики на
--    "realtime"."messages", використовуючи `realtime.topic()`
--    (поточний топік, до якого підключається клієнт) та `auth.uid()`
--    (з JWT, встановленого через `setAuth()` на клієнті).
drop policy if exists "participant_receives_conversation_broadcast" on "realtime"."messages";
create policy "participant_receives_conversation_broadcast"
on "realtime"."messages"
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and exists (
    select 1
    from "ConversationParticipant" cp
    where cp."userId" = (select auth.uid())::text
      and (select realtime.topic()) = 'conversation:' || cp."conversationId"
  )
);
