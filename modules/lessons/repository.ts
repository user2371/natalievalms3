import { prisma } from "@/lib/prisma";

/**
 * `modules/lessons/repository.ts` (задача 3.7) — лише прямі запити до
 * Prisma, без бізнес-логіки (визначення "поточного" уроку, призначення
 * `order` при створенні тощо — усе це в `service.ts`).
 */

export async function findLessonsByCourseId(courseId: string) {
  return prisma.lesson.findMany({
    where: { courseId },
    orderBy: { order: "asc" },
  });
}

export async function findLessonById(id: string) {
  return prisma.lesson.findUnique({
    where: { id },
  });
}

/** Найбільший `order` серед уроків курсу (для призначення `order` новому уроку в `service.ts`). */
export async function findMaxLessonOrder(courseId: string): Promise<number> {
  const lastLesson = await prisma.lesson.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return lastLesson?.order ?? 0;
}

/**
 * ID уроків курсу, які користувач ПРОЙШОВ (`Progress.completed = true`).
 * Потрібно лише для `getCurrentLessonService` у `service.ts` (задача 3.8,
 * визначення "поточного" уроку) — `modules/progress` як окремий модуль ще
 * не існує (Фаза 5/7 за `CLAUDE.md`), тому цей єдиний read-запит до
 * `Progress` тимчасово живе тут. Коли з'явиться `modules/progress` — цю
 * функцію варто буде звідти імпортувати замість дублювання запиту.
 */
export async function findCompletedLessonIdsForUser(
  userId: string,
  courseId: string,
): Promise<Set<string>> {
  const rows = await prisma.progress.findMany({
    where: { userId, completed: true, lesson: { courseId } },
    select: { lessonId: true },
  });
  return new Set(rows.map((row) => row.lessonId));
}

export interface CreateLessonData {
  courseId: string;
  order: number;
  title: string;
  duration?: string | null;
  videoProvider: string;
  videoUrl: string;
}

export async function createLesson(data: CreateLessonData) {
  return prisma.lesson.create({
    data: {
      courseId: data.courseId,
      order: data.order,
      title: data.title,
      duration: data.duration ?? null,
      videoProvider: data.videoProvider,
      videoUrl: data.videoUrl,
    },
  });
}

export interface UpdateLessonData {
  title?: string;
  duration?: string | null;
  videoProvider?: string;
  videoUrl?: string;
}

export async function updateLesson(id: string, data: UpdateLessonData) {
  return prisma.lesson.update({
    where: { id },
    data,
  });
}

export async function deleteLesson(id: string) {
  return prisma.lesson.delete({
    where: { id },
  });
}

/**
 * Перезаписує `order` для всіх переданих уроків згідно з новою
 * послідовністю (drag-and-drop у списку уроків адмінки, задача 3.9).
 * Виконується однією транзакцією, щоб не лишити курс з "дірками"/дублями
 * в `order`, якщо один із запитів впаде.
 */
export async function reorderLessons(orderedLessonIds: string[]) {
  await prisma.$transaction(
    orderedLessonIds.map((id, index) =>
      prisma.lesson.update({
        where: { id },
        data: { order: index + 1 },
      }),
    ),
  );
}
