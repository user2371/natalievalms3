-- ФАЗА MSG+, задачі MSG+.4.1/MSG+.4.2 (04.09.2026, за прямим проханням
-- користувача — "дозаверши все що лишилось в фазі msg"). Написана
-- вручну, той самий відомий виняток, що й попередні міграції фази
-- MSG+ (немає мережі до binaries.prisma.sh у пісочниці): `UserBlock`
-- (блокування, MSG+.4.1), `MessageReport` (репортинг повідомлення,
-- MSG+.4.1) і `ConversationModerationLog` (аудит-слід перегляду
-- репортнутої розмови адміном, MSG+.4.2). Реальне застосування —
-- `npx prisma migrate deploy` на користувачі локально/на CI.

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageReport" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "reporterId" TEXT,
    "reporterLabel" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "messageBodySnapshot" TEXT NOT NULL,
    "messageSenderLabel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationModerationLog" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "messageReportId" TEXT,
    "adminId" TEXT,
    "adminLabel" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "UserBlock_blockedId_idx" ON "UserBlock"("blockedId");

-- CreateIndex
CREATE INDEX "MessageReport_status_createdAt_idx" ON "MessageReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "MessageReport_conversationId_idx" ON "MessageReport"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationModerationLog_conversationId_idx" ON "ConversationModerationLog"("conversationId");

-- CreateIndex
CREATE INDEX "ConversationModerationLog_messageReportId_idx" ON "ConversationModerationLog"("messageReportId");

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBlock" ADD CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReport" ADD CONSTRAINT "MessageReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationModerationLog" ADD CONSTRAINT "ConversationModerationLog_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationModerationLog" ADD CONSTRAINT "ConversationModerationLog_messageReportId_fkey" FOREIGN KEY ("messageReportId") REFERENCES "MessageReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationModerationLog" ADD CONSTRAINT "ConversationModerationLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
