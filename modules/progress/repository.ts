import { prisma } from "@/lib/prisma";
import type { Progress } from "./schema";

/**
 * `modules/progress/repository.ts` (задача 7.2) — лише прямі запити до
 * Prisma, без бізнес-логіки (сама логіка мержу — у `service.ts`, задача
 * 7.3), той самий поділ, що й у решті модулів.
 */

export async function findByUserId(userId: string): Promise<Progress[]> {
  return prisma.progress.findMany({ where: { userId } });
}

/** Прогрес користувача лише по уроках ОДНОГО курсу (задача 7.2). */
export async function findByUserAndCourse(
  userId: string,
  courseId: string,
): Promise<Progress[]> {
  return prisma.progress.findMany({
    where: { userId, lesson: { courseId } },
  });
}

export interface UpsertProgressData {
  userId: string;
  lessonId: string;
  completed: boolean;
  quizScore: number | null;
  quizTotal: number | null;
  completedAt: Date | null;
}

/** Створює або оновлює прогрес уроку (задача 7.2, `@@unique([userId, lessonId])`). */
export async function upsert(data: UpsertProgressData): Promise<Progress> {
  return prisma.progress.upsert({
    where: { userId_lessonId: { userId: data.userId, lessonId: data.lessonId } },
    create: data,
    update: {
      completed: data.completed,
      quizScore: data.quizScore,
      quizTotal: data.quizTotal,
      completedAt: data.completedAt,
    },
  });
}

/**
 * `courseId` уроку — потрібно для групування entries по курсах при мержі
 * (задача 7.3) і для автостворення `Enrollment` (задача 7.10). Той самий
 * тимчасовий підхід, що й аналогічна функція в `modules/quizzes/repository.ts`
 * (`findLessonCourseId`) — дублюємо, а не імпортуємо звідти напряму
 * (модулі не залежать одне від одного напряму, лише через прямі
 * Prisma-запити в кожному).
 */
export async function findLessonCourseId(lessonId: string): Promise<string | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  });
  return lesson?.courseId ?? null;
}

/**
 * Fixes/F.10 (points fix): з переданих `lessonId` повертає ті, що МАЮТЬ
 * квіз (`Quiz.lessonId` — `@unique`, Фаза 6). Використовується
 * `syncLocalProgressService` (`service.ts`), щоб не дати клієнтському
 * payload позначити quiz-урок `completed: true` БЕЗ жодних ознак
 * реального проходження квізу (`quizTotal`) — сам факт "є квіз" вже
 * потребує довіряти хоч чомусь, окрім голого прапорця `completed`.
 */
export async function findLessonIdsWithQuiz(lessonIds: string[]): Promise<Set<string>> {
  if (lessonIds.length === 0) return new Set();
  const rows = await prisma.quiz.findMany({
    where: { lessonId: { in: lessonIds } },
    select: { lessonId: true },
  });
  return new Set(rows.map((row) => row.lessonId));
}

export interface CourseCompletionCounts {
  total: number;
  completed: number;
}

/**
 * Скільки всього уроків у курсі і скільки з них цей користувач ПРОЙШОВ
 * (`Progress.completed = true`) — Fixes/F.10 (points fix): той самий
 * запит, що вже є в `modules/quizzes/repository.ts`
 * (`getCourseCompletionCounts`), дубльовано за тим самим принципом, що й
 * `findLessonCourseId` вище (модулі не залежать одне від одного напряму).
 * Потрібен, щоб `syncLocalProgressService` (`service.ts`) міг нарахувати
 * +5 балів за курс і для шляху ручного позначення уроку (без квізу), і
 * для шляху "гість пройшов квіз → залогінився" — раніше жоден із них не
 * нараховував бали за курс узагалі.
 */
export async function getCourseCompletionCounts(
  userId: string,
  courseId: string,
): Promise<CourseCompletionCounts> {
  const [total, completed] = await Promise.all([
    prisma.lesson.count({ where: { courseId } }),
    prisma.progress.count({ where: { userId, completed: true, lesson: { courseId } } }),
  ]);
  return { total, completed };
}

/**
 * "Знайти або створити" запис на курс — ІДЕМПОТЕНТНО завдяки
 * `@@unique([userId, courseId])` у Prisma-схемі. Одним цим викликом
 * закриваються і задача 7.10 (автостворення `Enrollment`), і задача 7.9
 * (конфлікт enrollments — `upsert` із порожнім `update` просто не робить
 * нічого, якщо запис уже існує, тож "конфлікту" в сенсі падіння/дублікату
 * фізично не може статись).
 */
export async function ensureEnrollment(userId: string, courseId: string): Promise<void> {
  await prisma.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId },
    update: {},
  });
}
