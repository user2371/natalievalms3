import {
  CreateLessonInput,
  CreateLessonSchema,
  Lesson,
  ReorderLessonsInput,
  ReorderLessonsSchema,
  UpdateLessonInput,
  UpdateLessonSchema,
} from "./schema";
import * as repository from "./repository";

/**
 * `modules/lessons/service.ts` (задача 3.8) — бізнес-логіка та валідація
 * поверх `repository.ts`.
 *
 * **Ключове бізнес-правило (задача 3.8, `CLAUDE.md`: "Уроки не
 * блокуються"): усі уроки курсу завжди доступні для перегляду, незалежно
 * від прогресу.** Тут НЕМАЄ жодної функції на кшталт `isLessonUnlocked` —
 * така логіка суперечила б архітектурі проєкту. Єдине, що робить сервіс із
 * прогресом користувача, — визначає, який урок вважати "поточним" (перший
 * непройдений) для UI-підсвітки в сайдбарі й тексту кнопки "Продовжити"
 * на лендінгу курсу (задачі 3.11–3.13) — суто навігаційна підказка, не
 * гейт доступу.
 */

export async function listLessonsService(courseId: string): Promise<Lesson[]> {
  return repository.findLessonsByCourseId(courseId);
}

export interface LessonWithCompletion extends Lesson {
  completed: boolean;
}

/**
 * Fixes (02.08.2026, задача F.6): список уроків курсу з реальним статусом
 * проходження конкретного користувача — те саме, що вже рахує
 * `getCurrentLessonService` (`findCompletedLessonIdsForUser`) нижче, лише
 * повертає ввесь список з прапорцем `completed` на кожному уроці, а не
 * лише "перший непройдений". Потрібно для реального чекліста уроків на
 * `/my-learning` (раніше сторінка показувала статичний легасі-чекліст
 * `LESSONS`/`useLocalProgress`, повністю не пов'язаний із реальними
 * курсами — той самий клас багів, що вже виправлявся на `/profile`/
 * `/homework`, F.1/F.2/F.5).
 */
export async function listLessonsWithCompletionService(
  courseId: string,
  userId: string,
): Promise<LessonWithCompletion[]> {
  const [lessons, completedIds] = await Promise.all([
    repository.findLessonsByCourseId(courseId),
    repository.findCompletedLessonIdsForUser(userId, courseId),
  ]);

  return lessons.map((lesson) => ({
    ...lesson,
    completed: completedIds.has(lesson.id),
  }));
}

export async function getLessonByIdService(id: string) {
  return repository.findLessonById(id);
}

export interface CurrentLessonResult {
  /** Перший непройдений урок курсу, або `null`, якщо курс порожній чи всі уроки пройдені. */
  lesson: Lesson | null;
  /** `true`, якщо користувач пройшов усі уроки курсу (і `lesson` тому `null`). */
  allCompleted: boolean;
}

/**
 * Визначає "поточний" урок курсу для конкретного користувача — перший за
 * `order` урок, якого немає серед пройдених (`Progress.completed = true`).
 * Якщо користувач ще жодного уроку не проходив — це перший урок курсу
 * (`LESSONS[0]`, як і задокументовано в `CLAUDE.md` для вступного уроку
 * "Знайомство"). Якщо всі уроки пройдені — `lesson: null, allCompleted: true`
 * (UI вирішує сам, що показати: "Курс пройдено" / кнопку "Повторити" тощо).
 */
export async function getCurrentLessonService(
  courseId: string,
  userId: string,
): Promise<CurrentLessonResult> {
  const lessons = await repository.findLessonsByCourseId(courseId);
  if (lessons.length === 0) {
    return { lesson: null, allCompleted: false };
  }

  const completedLessonIds = await repository.findCompletedLessonIdsForUser(
    userId,
    courseId,
  );

  const currentLesson = lessons.find((lesson) => !completedLessonIds.has(lesson.id));
  if (!currentLesson) {
    return { lesson: null, allCompleted: true };
  }

  return { lesson: currentLesson, allCompleted: false };
}

export async function createLessonService(input: CreateLessonInput) {
  const parsed = CreateLessonSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані уроку");
  }

  const maxOrder = await repository.findMaxLessonOrder(parsed.data.courseId);

  return repository.createLesson({
    courseId: parsed.data.courseId,
    order: maxOrder + 1,
    title: parsed.data.title,
    duration: parsed.data.duration,
    videoProvider: parsed.data.videoProvider,
    videoUrl: parsed.data.videoUrl,
  });
}

export async function updateLessonService(input: UpdateLessonInput) {
  const parsed = UpdateLessonSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані уроку");
  }

  const existing = await repository.findLessonById(parsed.data.id);
  if (!existing) {
    throw new Error("Урок не знайдено");
  }

  const { id, ...rest } = parsed.data;
  return repository.updateLesson(id, rest);
}

export async function deleteLessonService(id: string) {
  const existing = await repository.findLessonById(id);
  if (!existing) {
    throw new Error("Урок не знайдено");
  }

  return repository.deleteLesson(id);
}

export async function reorderLessonsService(input: ReorderLessonsInput) {
  const parsed = ReorderLessonsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректний порядок уроків");
  }

  const existingLessons = await repository.findLessonsByCourseId(parsed.data.courseId);
  const existingIds = new Set(existingLessons.map((lesson) => lesson.id));
  const sameSet =
    existingIds.size === parsed.data.orderedLessonIds.length &&
    parsed.data.orderedLessonIds.every((id) => existingIds.has(id));

  if (!sameSet) {
    throw new Error("Переданий список уроків не відповідає урокам цього курсу");
  }

  await repository.reorderLessons(parsed.data.orderedLessonIds);
  return repository.findLessonsByCourseId(parsed.data.courseId);
}
