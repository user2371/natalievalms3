-- ФАЗА CERT+, задача CERT+.0.2 (08.08.2026). Той самий підхід, що вже в
-- `20260802120000_certificates`: новий enum, розширення наявної
-- таблиці, зняття NOT NULL з "courseId" (тепер опційне поле — власні
-- завантажені сертифікати без прив'язки до курсу).

-- CreateEnum
CREATE TYPE "CertificateSource" AS ENUM ('SYSTEM', 'UPLOADED');

-- AlterTable
ALTER TABLE "Certificate"
  ALTER COLUMN "courseId" DROP NOT NULL,
  ADD COLUMN "source" "CertificateSource" NOT NULL DEFAULT 'SYSTEM',
  ADD COLUMN "title" TEXT,
  ADD COLUMN "imageUrl" TEXT,
  ADD COLUMN "imagePublicId" TEXT,
  ADD COLUMN "width" INTEGER,
  ADD COLUMN "height" INTEGER,
  ADD COLUMN "sizeBytes" INTEGER;
