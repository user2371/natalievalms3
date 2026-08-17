import type { QuizOption, QuizQuestion } from "@/lib/data/lessons";
import {
  CreateQuestionInput,
  CreateQuestionSchema,
  ReorderQuestionsInput,
  ReorderQuestionsSchema,
  SubmitAnswerInput,
  SubmitAnswerSchema,
  UpdateQuestionInput,
  UpdateQuestionSchema,
} from "./schema";
import * as repository from "./repository";

/**
 * `modules/quizzes/service.ts` (задачі 6.3/6.4) — бізнес-логіка та
 * валідація поверх `repository.ts`.
 */

export async function getQuizByLessonIdService(lessonId: string) {
  return repository.findQuizByLessonId(lessonId);
}

export async function getQuestionByIdService(id: string) {
  return repository.findQuestionById(id);
}

/**
 * Задача 6.9: адаптує реальні (Prisma) `Question`+`Answer` у форму
 * `QuizQuestion[]` — ту саму, яку вже очікує існуючий статичний
 * `QuizBlock.tsx`/`QuizQuestionView.tsx`/`QuizOptions.tsx` (з
 * `lib/data/lessons.ts`, ПЕРЕВИКОРИСТАНІ без жодних змін, задача 6.10:
 * увесь стейт-машин проходження — індекс питання, обрані відповіді,
 * навігація вперед/назад, перевірка, фінальний екран — уже реалізований
 * там ще в Фазі 0, повторно писати його для реальних даних не було сенсу).
 *
 * `multiple` НЕ зберігається як окреме поле в Prisma — виводиться тут із
 * кількості правильних відповідей питання (0 або 1 → `false`/radio, 2+ →
 * `true`/checkbox), той самий підхід, що вже описаний у `schema.ts`.
 *
 * Повертає `null`, якщо в уроку взагалі немає квізу або питань — виклик
 * "уроку без квізу" (задача 6.19) обробляє сторінка-споживач.
 */
export async function getQuizQuestionsForLessonService(
  lessonId: string,
): Promise<QuizQuestion[] | null> {
  const quiz = await repository.findQuizByLessonId(lessonId);
  if (!quiz || quiz.questions.length === 0) {
    return null;
  }

  return quiz.questions.map((question) => {
    const options: QuizOption[] = question.answers.map((answer) => ({
      id: answer.id,
      text: answer.text,
      correct: answer.isCorrect,
    }));
    const correctCount = question.answers.filter((answer) => answer.isCorrect).length;

    return {
      id: question.id,
      text: question.text,
      imageUrl: question.imageUrl ?? undefined,
      multiple: correctCount > 1,
      options,
    };
  });
}

/**
 * Задача 6.3: перевіряє відповідь(і) користувача на ОДНЕ питання.
 *
 * **Правило (задокументовано тут і в задачі 6.29): зараховується вірним
 * ЛИШЕ якщо обраний набір ID точно збігається з набором усіх правильних
 * відповідей — не більше і не менше.** Той самий принцип, що вже в
 * статичному `QuizBlock.isQuestionCorrect` (не чіпали): вибір лише
 * частини правильних варіантів у multi-choice питанні = невірно, як і
 * вибір усіх правильних ПЛЮС зайвий неправильний.
 */
export async function checkAnswerService(input: SubmitAnswerInput) {
  const parsed = SubmitAnswerSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректна відповідь");
  }

  const question = await repository.findQuestionById(parsed.data.questionId);
  if (!question) {
    throw new Error("Питання не знайдено");
  }

  const correctAnswerIds = question.answers
    .filter((answer) => answer.isCorrect)
    .map((answer) => answer.id);
  const selected = parsed.data.selectedAnswerIds;

  const correct =
    selected.length === correctAnswerIds.length &&
    selected.every((id) => correctAnswerIds.includes(id));

  return { correct, correctAnswerIds };
}

/**
 * Задача 6.4: підраховує фінальний результат (X правильних з Y) для
 * всього квізу уроку за масивом відповідей користувача на кожне питання.
 * Питання, на які відповіді не надано, зараховуються невірними (не
 * пропускаються) — не має сенсу дозволяти "пропустити" питання і не
 * зарахувати помилку.
 */
export async function calculateQuizScoreService(
  lessonId: string,
  answers: SubmitAnswerInput[],
): Promise<{ score: number; total: number }> {
  const quiz = await repository.findQuizByLessonId(lessonId);
  if (!quiz || quiz.questions.length === 0) {
    return { score: 0, total: 0 };
  }

  let score = 0;
  for (const question of quiz.questions) {
    const submitted = answers.find((answer) => answer.questionId === question.id);
    const correctAnswerIds = question.answers
      .filter((answer) => answer.isCorrect)
      .map((answer) => answer.id);

    const isCorrect = submitted
      ? submitted.selectedAnswerIds.length === correctAnswerIds.length &&
        submitted.selectedAnswerIds.every((id) => correctAnswerIds.includes(id))
      : false;

    if (isCorrect) score += 1;
  }

  return { score, total: quiz.questions.length };
}

export async function createQuestionService(input: CreateQuestionInput) {
  const parsed = CreateQuestionSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані питання");
  }

  const quiz = await repository.getOrCreateQuizForLesson(parsed.data.lessonId);
  const maxOrder = await repository.findMaxQuestionOrder(quiz.id);

  return repository.createQuestion({
    quizId: quiz.id,
    order: maxOrder + 1,
    type: parsed.data.type,
    text: parsed.data.text,
    imageUrl: parsed.data.imageUrl,
    answers: parsed.data.answers,
  });
}

export async function updateQuestionService(input: UpdateQuestionInput) {
  const parsed = UpdateQuestionSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані питання");
  }

  const existing = await repository.findQuestionById(parsed.data.id);
  if (!existing) {
    throw new Error("Питання не знайдено");
  }

  const { id, ...rest } = parsed.data;
  return repository.updateQuestion(id, rest);
}

export async function deleteQuestionService(id: string) {
  const existing = await repository.findQuestionById(id);
  if (!existing) {
    throw new Error("Питання не знайдено");
  }

  return repository.deleteQuestion(id);
}

export async function reorderQuestionsService(input: ReorderQuestionsInput) {
  const parsed = ReorderQuestionsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректний порядок питань");
  }

  const quiz = await repository.findQuizByLessonId(parsed.data.lessonId);
  if (!quiz) {
    throw new Error("Квіз для цього уроку не знайдено");
  }

  const existingIds = new Set(quiz.questions.map((question) => question.id));
  const sameSet =
    existingIds.size === parsed.data.orderedQuestionIds.length &&
    parsed.data.orderedQuestionIds.every((id) => existingIds.has(id));

  if (!sameSet) {
    throw new Error("Переданий список питань не відповідає квізу цього уроку");
  }

  await repository.reorderQuestions(parsed.data.orderedQuestionIds);
  return repository.findQuizByLessonId(parsed.data.lessonId);
}

/**
 * Задача 6.7: зберігає фінальний результат квізу для ЗАЛОГІНЕНОГО
 * користувача (`Progress`, задача 5.17-style upsert). Гості проходять той
 * самий квіз без запису сюди — `useProgress`/`localProgress.ts` (Фаза 5)
 * зберігає їхній результат у `localStorage`. Викликається лише з
 * `actions.ts` після перевірки сесії.
 */
export async function submitQuizResultService(
  userId: string,
  lessonId: string,
  score: number,
  total: number,
) {
  return repository.upsertLessonQuizProgress(userId, lessonId, score, total);
}

export interface CourseCompletionCheck {
  completed: boolean;
  courseId: string | null;
}

/**
 * Задача 6.6.5: чи завершено ВЕСЬ курс цього уроку (усі уроки курсу мають
 * `Progress.completed = true` для цього користувача) — викликається з
 * `actions.ts` ПІСЛЯ `submitQuizResultService`, щоб вирішити, чи
 * нараховувати +5 балів за курс (`awardCoursePoints`,
 * `modules/points/service.ts`).
 */
export async function isCourseFullyCompletedForLessonService(
  userId: string,
  lessonId: string,
): Promise<CourseCompletionCheck> {
  const courseId = await repository.findLessonCourseId(lessonId);
  if (!courseId) {
    return { completed: false, courseId: null };
  }

  const { total, completed } = await repository.getCourseCompletionCounts(
    userId,
    courseId,
  );
  return {
    completed: total > 0 && completed >= total,
    courseId,
  };
}
