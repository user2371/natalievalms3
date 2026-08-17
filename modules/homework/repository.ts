import { prisma } from "@/lib/prisma";
import type { HomeworkSubmission } from "./schema";

/**
 * `modules/homework/repository.ts` — лише прямі запити до Prisma, без
 * бізнес-логіки (валідація URL — у `service.ts`), той самий поділ, що й у
 * `modules/comments/repository.ts`.
 */

/** Здача ДЗ конкретного користувача під конкретним уроком — одна на пару (userId, lessonId), як у легасі `localHomework.ts`. */
export async function findByLessonAndUser(
  lessonId: string,
  userId: string,
): Promise<HomeworkSubmission | null> {
  return prisma.homeworkSubmission.findFirst({
    where: { lessonId, userId },
  });
}

export interface UpsertHomeworkData {
  lessonId: string;
  userId: string;
  videoUrl: string;
}

/**
 * Повторна здача перезаписує попереднє посилання (той самий принцип, що й
 * у легасі `localHomework.ts`: "Одне посилання на урок") — немає
 * `@@unique([lessonId, userId])` у Prisma-схемі (модель готувалась заздалегідь
 * без цього обмеження), тож перевіряємо наявність вручну й або оновлюємо,
 * або створюємо новий запис.
 */
export async function upsert(data: UpsertHomeworkData): Promise<HomeworkSubmission> {
  const existing = await prisma.homeworkSubmission.findFirst({
    where: { lessonId: data.lessonId, userId: data.userId },
    select: { id: true },
  });

  if (existing) {
    return prisma.homeworkSubmission.update({
      where: { id: existing.id },
      data: { videoUrl: data.videoUrl },
    });
  }

  return prisma.homeworkSubmission.create({ data });
}
