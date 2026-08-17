import { prisma } from "@/lib/prisma";
import type { Article } from "./schema";

/**
 * `modules/articles/repository.ts` — лише прямі запити до Prisma, без
 * бізнес-логіки (валідація — у `service.ts`), той самий поділ, що й у
 * решті модулів.
 */

export async function findByLessonId(lessonId: string): Promise<Article | null> {
  return prisma.article.findUnique({ where: { lessonId } });
}

/** Створює статтю уроку або оновлює наявну (`@@unique` на `lessonId` — задача 8.3.3). */
export async function upsert(lessonId: string, contentJson: string): Promise<Article> {
  return prisma.article.upsert({
    where: { lessonId },
    create: { lessonId, contentJson },
    update: { contentJson },
  });
}
