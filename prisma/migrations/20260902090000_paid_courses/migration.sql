-- ФАЗА PAID+, задача PAID+.0 (02.09.2026, за прямим проханням
-- користувача — "зроби щоб можна було при створенні чи редагуванні
-- курсу вибирати безкоштовний чи платний курс"). `isPaid`/`priceUAH`
-- на `Course` — той самий підхід, що вже `published`/`categories`
-- (простий прапорець + опційне поле на самій моделі). `CoursePurchase`
-- додається структурно ЗАРАЗ (щоб не робити другу міграцію базових
-- полів курсу пізніше), але РЕАЛЬНО не заповнюється жодним кодом, доки
-- не підключено платіжного провайдера (ФАЗА PAID+.4, окрема наступна
-- фаза, не входить у цю міграцію).

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "priceUAH" INTEGER;

-- CreateTable
CREATE TABLE "CoursePurchase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
    "amountUAH" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "CoursePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CoursePurchase_providerOrderId_key" ON "CoursePurchase"("providerOrderId");

-- CreateIndex
CREATE INDEX "CoursePurchase_userId_courseId_status_idx" ON "CoursePurchase"("userId", "courseId", "status");

-- AddForeignKey
ALTER TABLE "CoursePurchase" ADD CONSTRAINT "CoursePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePurchase" ADD CONSTRAINT "CoursePurchase_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
