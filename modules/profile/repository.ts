import { prisma } from "@/lib/prisma";

/**
 * `modules/profile/repository.ts` — лише прямі запити до Prisma, без
 * бізнес-логіки (сама агрегація — у `service.ts`, задача 6.6.16). Той
 * самий поділ, що й у решті модулів; окремої задачі на `repository.ts` у
 * `TASKS_DETAILED.md` для цього модуля нема (лише `service.ts`/`actions.ts`,
 * 6.6.16/6.6.17), але без прямих запитів сервіс не може працювати —
 * необхідний плумбінг (той самий випадок, що й `modules/achievements`
 * раніше).
 */

export interface ProfileUserRow {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  about: string | null;
  homeworkVisible: boolean;
  createdAt: Date;
}

export async function findUserById(userId: string): Promise<ProfileUserRow | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nickname: true,
      avatarUrl: true,
      about: true,
      homeworkVisible: true,
      createdAt: true,
    },
  });
}

export interface CourseProgressRow {
  courseId: string;
  slug: string;
  title: string;
  coverImage: string | null;
  totalLessons: number;
  completedLessons: number;
}

/** Курси, у яких у користувача є ХОЧА Б ОДИН пройдений урок (не обов'язково курс завершено на 100%). */
export async function findCoursesProgressForUser(
  userId: string,
): Promise<CourseProgressRow[]> {
  const courses = await prisma.course.findMany({
    where: { lessons: { some: { progress: { some: { userId, completed: true } } } } },
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      lessons: { select: { id: true } },
    },
  });

  return Promise.all(
    courses.map(
      async (course: {
        id: string;
        slug: string;
        title: string;
        coverImage: string | null;
        lessons: { id: string }[];
      }) => {
        const lessonIds = course.lessons.map((lesson) => lesson.id);
        const completedLessons = await prisma.progress.count({
          where: { userId, completed: true, lessonId: { in: lessonIds } },
        });
        return {
          courseId: course.id,
          slug: course.slug,
          title: course.title,
          coverImage: course.coverImage,
          totalLessons: lessonIds.length,
          completedLessons,
        };
      },
    ),
  );
}

export interface HomeworkSubmissionRow {
  courseName: string;
  lessonNumber: number;
  lessonTitle: string;
  videoUrl: string;
  submittedAt: Date;
}

export async function findHomeworkSubmissionsForUser(
  userId: string,
): Promise<HomeworkSubmissionRow[]> {
  const rows = await prisma.homeworkSubmission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { lesson: { include: { course: { select: { title: true } } } } },
  });

  return rows.map(
    (row: {
      videoUrl: string;
      createdAt: Date;
      lesson: { order: number; title: string; course: { title: string } };
    }) => ({
      courseName: row.lesson.course.title,
      lessonNumber: row.lesson.order,
      lessonTitle: row.lesson.title,
      videoUrl: row.videoUrl,
      submittedAt: row.createdAt,
    }),
  );
}

/**
 * Задача 9.15 (виправлення прогалини 2, знайденої під час трасування
 * E2E-сценарію): реальний запис `User.homeworkVisible` у БД — раніше цю
 * колонку читав лише `findUserById` (для публічного профілю), тепер сюди
 * ще й ПИШЕ перемикач у `/settings` (`updateHomeworkVisibilityAction`,
 * `actions.ts`).
 */
export async function updateHomeworkVisible(
  userId: string,
  homeworkVisible: boolean,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { homeworkVisible },
  });
}

/**
 * Задача 3+.4.2 — той самий шаблон, що й `updateHomeworkVisible` вище:
 * пряме `prisma.user.update` без бізнес-логіки (валідація довжини —
 * `UpdateBioSchema`, задача 3+.4.1, застосовується в `actions.ts` ДО
 * виклику сервісу/репозиторію).
 */
export async function updateBio(userId: string, about: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { about },
  });
}
