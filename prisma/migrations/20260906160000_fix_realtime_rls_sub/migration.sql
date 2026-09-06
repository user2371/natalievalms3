-- ФАЗА MSG+, задача MSG+.2.3 (06.09.2026) — виправлення RLS політик для Supabase Realtime.
--
-- ПРИЧИНА: Стандартна функція `auth.uid()` у Supabase виконує примусове
-- кастування claim `sub` до типу `uuid` (`::uuid`). Якщо `userId` у сесії
-- є текстовим рядком CUID або має інший формат, кастування викидає виняток
-- усередині Postgres RLS, через що Postgres повертає 0 рядків для Realtime
-- і подія `INSERT` не надсилається у WebSocket.
--
-- ПІДХІД: Використовуємо пряме читання `request.jwt.claims->>'sub'` без
-- кастування до uuid, що робить перевірку 100% сумісною з будь-якими ID.

DROP POLICY IF EXISTS "participant_reads_own_membership" ON "ConversationParticipant";
DROP POLICY IF EXISTS "participant_reads_own_conversation" ON "Conversation";
DROP POLICY IF EXISTS "participant_reads_own_messages" ON "Message";

CREATE POLICY "participant_reads_own_membership"
  ON "ConversationParticipant"
  FOR SELECT
  TO authenticated
  USING ((current_setting('request.jwt.claims', true)::json->>'sub') = "userId");

CREATE POLICY "participant_reads_own_conversation"
  ON "Conversation"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant" cp
      WHERE cp."conversationId" = "Conversation"."id"
        AND cp."userId" = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

CREATE POLICY "participant_reads_own_messages"
  ON "Message"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "ConversationParticipant" cp
      WHERE cp."conversationId" = "Message"."conversationId"
        AND cp."userId" = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );
