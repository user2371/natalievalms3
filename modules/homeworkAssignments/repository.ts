import { prisma } from "@/lib/prisma";
import type { HomeworkAssignment } from "./schema";

/**
 * `modules/homeworkAssignments/repository.ts` — ФАЗА HW+, задача HW+.1.2.
 * Лише прямі запити до Prisma, без бізнес-логіки (валідація — у
 * `service.ts`), той самий поділ, що й у решті модулів.
 */

export async function findByLessonId(lessonId: string): Promise<HomeworkAssignment | null> {
  return prisma.homeworkAssignment.findUnique({ where: { lessonId } });
}

/** Створює опис ДЗ уроку або оновлює наявний (`@@unique` на `lessonId`). */
export async function upsert(
  lessonId: string,
  data: { contentJson: string | null; videoUrl: string | null },
): Promise<HomeworkAssignment> {
  return prisma.homeworkAssignment.upsert({
    where: { lessonId },
    create: { lessonId, ...data },
    update: data,
  });
}
