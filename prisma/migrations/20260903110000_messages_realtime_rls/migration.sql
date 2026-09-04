-- ФАЗА MSG+, задача MSG+.2.1/MSG+.2.2 (03.09.2026, за прямим проханням
-- користувача — "бери MSG+ 2"). Написана вручну, той самий відомий
-- виняток пісочниці, що й у `20260903100000_private_messages/` (немає
-- мережі до `binaries.prisma.sh`, `prisma migrate dev` недоступний) —
-- Prisma не керує RLS/публікаціями напряму (це поза моделлю `schema.prisma`),
-- тому цей файл додано в міграції вручну, як і сам SQL міграцій завжди
-- писався в цьому проєкті.
--
-- Реалізує рішення MSG+.2.2: RLS на рівні бази — а не "непередбачуваність
-- UUID" — захищає, хто саме може підписатись на Realtime-зміни в
-- `Message`. Присвоєння `auth.uid()` тут спирається на міст-токен
-- (`lib/realtime/supabaseRealtimeToken.ts`, MSG+.2.1): підписаний тим
-- самим `SUPABASE_JWT_SECRET`, що налаштований у Supabase-проєкті, з
-- claim'ом `sub` = `User.id` — той самий механізм, яким Supabase
-- резолвить `auth.uid()` незалежно від того, Supabase Auth чи "bring
-- your own auth" видав токен.
--
-- ⚠️ ПЕРЕДУМОВА (не перевірено в пісочниці — немає мережі до реального
-- Supabase-проєкту користувача): роль, якою Prisma підключається до
-- бази (`DATABASE_URL`), НЕ повинна збігатися з ролями `anon`/
-- `authenticated`, якими Supabase API (PostgREST/Realtime) виконує
-- запити — інакше `FORCE ROW LEVEL SECURITY` нижче або зламає власні
-- server actions (`modules/messages/*`), або (якщо роль Prisma — власник
-- таблиці/superuser) RLS мовчки не застосується до неї взагалі
-- (стандартна поведінка Postgres — власник таблиці й так обходить RLS).
-- Типовий Supabase-проєкт саме так і влаштований (Prisma використовує
-- `postgres`-роль, окрему від `anon`/`authenticated`), тож цей файл
-- виходить з цього припущення; користувачу варто звірити зі своїм
-- реальним `DATABASE_URL` перед застосуванням.

-- EnableRLS
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;

-- CreatePolicy
-- Учасник бачить (через Supabase API/Realtime) лише власні записи
-- членства — потрібно, щоб policy на `Message` нижче могла спиратись на
-- `ConversationParticipant` через підзапит під тим самим `authenticated`-
-- виконавцем.
CREATE POLICY "participant_reads_own_membership"
  ON "ConversationParticipant"
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

-- CreatePolicy
-- Розмова видима учаснику лише якщо він реально є учасником —
-- дзеркалить перевірку `assertParticipant` (`modules/messages/service.ts`,
-- MSG+.1.2), але на рівні Postgres, для шляху через Supabase API/Realtime
-- (не через Prisma, який і так уже перевіряє це в сервісному шарі).
CREATE POLICY "participant_reads_own_conversation"
  ON "Conversation"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant" cp
      WHERE cp."conversationId" = "Conversation"."id"
        AND cp."userId" = auth.uid()::text
    )
  );

-- CreatePolicy
-- Головна політика для MSG+.2.3 (`useConversationRealtime`): Postgres
-- Changes на `Message` віддає INSERT-подію конкретному підписнику лише
-- якщо він учасник саме цієї `conversationId` — той самий принцип
-- мінімального доступу, що вже в рішенні MSG+.4.2 (ADMIN не бачить усі
-- приватні розмови "про всяк випадок").
CREATE POLICY "participant_reads_own_messages"
  ON "Message"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant" cp
      WHERE cp."conversationId" = "Message"."conversationId"
        AND cp."userId" = auth.uid()::text
    )
  );

-- EnableRealtimeForTable
-- Без цього Postgres Changes нічого не відправить, незалежно від RLS —
-- таблиця має бути в публікації, яку слухає Supabase Realtime.
ALTER PUBLICATION supabase_realtime ADD TABLE "Message";
