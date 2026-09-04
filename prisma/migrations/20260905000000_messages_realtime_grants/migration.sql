-- ФАЗА MSG+, задача MSG+.2.3 (05.09.2026) — виправлення.
--
-- ПРИЧИНА: попередня міграція `20260903110000_messages_realtime_rls`
-- увімкнула RLS і додала CREATE POLICY для ролі authenticated, але
-- НЕ видала базовий GRANT SELECT на ці таблиці. В Postgres RLS лише
-- ФІЛЬТРУЄ рядки в межах уже дозволеного запиту — сама можливість
-- виконати SELECT на таблиці спершу вимагає окремого табличного
-- GRANT. Без нього Postgres відмовляє в доступі ще ДО перевірки
-- RLS-політик, і Supabase Realtime тихо (без помилки, видимої
-- клієнту) відмовляється створювати запис у `realtime.subscription`
-- для postgres_changes-підписки — клієнтський канал при цьому все
-- одно показує статус "SUBSCRIBED" (сам WebSocket підключається
-- нормально), що робило цю причину складною для виявлення.
--
-- Підтверджено вручну в SQL Editor продакшн-проєкту (05.09.2026):
-- `select * from information_schema.role_table_grants where
-- table_name in ('Message','Conversation','ConversationParticipant')
-- and grantee in ('authenticated','anon')` — 0 рядків до цієї міграції.
--
-- ⚠️ Той самий відомий виняток пісочниці, що й у двох попередніх
-- ручних SQL-міграціях (`20260903100000_private_messages/`,
-- `20260903110000_messages_realtime_rls/`) — `prisma migrate dev`
-- недоступний без мережі до `binaries.prisma.sh`, тому цей файл
-- написано вручну й застосовано напряму через Supabase SQL Editor
-- (користувачем, 05.09.2026), а сюди доданий лише для фіксації в
-- історії міграцій репозиторію.

-- GrantSelect
grant select on "Message" to authenticated;
grant select on "Conversation" to authenticated;
grant select on "ConversationParticipant" to authenticated;
