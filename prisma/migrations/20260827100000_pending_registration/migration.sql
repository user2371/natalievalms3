-- F.26.1, підтвердження email кодом перед реєстрацією (27.08.2026).
-- Незавершена реєстрація: реальний User ще не існує, поки не введено
-- правильний код із листа Resend. codeHash — хеш 6-значного коду (той
-- самий bcrypt-підхід, що й passwordHash, lib/auth/verificationCode.ts).
-- attempts рахує невдалі спроби вводу коду (ліміт MAX_CODE_ATTEMPTS у
-- lib/auth/verificationCode.ts), expiresAt — TTL коду.

-- CreateTable
CREATE TABLE "PendingRegistration" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingRegistration_email_key" ON "PendingRegistration"("email");
