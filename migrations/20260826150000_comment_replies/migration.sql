-- F.25.1, відповіді на коментарі (26.08.2026). Self-relation на "Comment":
-- "parentId" — опційне посилання на батьківський коментар у межах того
-- самого уроку (перевірка, що lessonId співпадає, робиться на рівні
-- сервісу, а не тут — Prisma self-relation не вміє crossfield-перевірки).
-- onDelete: Cascade означає, що видалення батьківського коментаря
-- автоматично видалить усі відповіді на нього (F.25.10.2 — чи потрібне
-- окреме попередження в UI перед такою дією, ще не вирішено).

-- AlterTable
ALTER TABLE "Comment"
  ADD COLUMN "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Comment"
  ADD CONSTRAINT "Comment_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Comment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");
