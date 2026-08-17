import type { PointsSummary } from "./schema";
import * as repository from "./repository";

/**
 * `modules/points/service.ts` (задача 6.6.4) — бізнес-логіка нарахування
 * балів. Бали нараховуються АВТОМАТИЧНО: +1 за завершений урок, +5 за
 * завершений курс (вимога з шапки Фази 6.6 у `TASKS_DETAILED.md`).
 */

const LESSON_COMPLETED_POINTS = 1;
const COURSE_COMPLETED_POINTS = 5;

/**
 * +1 бал за завершений урок — ІДЕМПОТЕНТНО: якщо за цей `lessonId` цьому
 * `userId` вже нараховано (`findExistingAward`), повторний виклик нічого
 * не робить і повертає `null` (без другого запису в журналі). Виклик —
 * з тригера (задача 6.6.5) після того, як `Progress.completed` для уроку
 * стає `true`.
 */
export async function awardLessonPoints(userId: string, lessonId: string) {
  const existing = await repository.findExistingAward(
    userId,
    "LESSON_COMPLETED",
    lessonId,
  );
  if (existing) return null;

  return repository.create({
    userId,
    amount: LESSON_COMPLETED_POINTS,
    reason: "LESSON_COMPLETED",
    lessonId,
  });
}

/**
 * +5 балів за завершений курс — та сама ідемпотентність, що й
 * `awardLessonPoints`, ключ — `courseId`. Викликач (задача 6.6.5)
 * відповідає за перевірку "усі уроки курсу справді пройдені" ДО виклику
 * цієї функції — сама вона лише гарантує, що повторний виклик для вже
 * нагородженого курсу не задублює запис.
 */
export async function awardCoursePoints(userId: string, courseId: string) {
  const existing = await repository.findExistingAward(
    userId,
    "COURSE_COMPLETED",
    courseId,
  );
  if (existing) return null;

  return repository.create({
    userId,
    amount: COURSE_COMPLETED_POINTS,
    reason: "COURSE_COMPLETED",
    courseId,
  });
}

export async function getPointsSummaryService(userId: string): Promise<PointsSummary> {
  const totalPoints = await repository.sumByUserId(userId);
  return { totalPoints };
}

export async function getPointsHistoryService(userId: string) {
  return repository.findByUserId(userId);
}

/** Місце користувача в загальному рейтингу балів (задача 6.6.6). */
export async function getUserRankService(userId: string): Promise<number> {
  return repository.getUserRank(userId);
}

/** Скільки всього рейтингованих юзерів — для `rankOutOf` (задача 6.6.18). */
export async function getRankedUsersCountService(): Promise<number> {
  return repository.countRankedUsers();
}
