-- ФАЗА CERTTPL+, задача CERTTPL+.0.1 (30.08.2026). За прямим проханням
-- користувача — опційний Cloudinary URL макета сертифіката курсу.
-- Той самий підхід, що "AlterTable" у попередніх фазах (проста опційна
-- текстова колонка, без нового enum/таблиці — той самий принцип, що
-- вже `coverImage` на цій самій моделі).

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "certificateImage" TEXT;
