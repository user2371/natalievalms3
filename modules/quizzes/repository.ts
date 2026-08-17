import { prisma } from "@/lib/prisma";

/**
 * `modules/quizzes/repository.ts` (задача 6.2) — лише прямі запити до
 * Prisma, без бізнес-логіки (перевірка відповідей, підрахунок score —
 * усе це в `service.ts`).
 */

export async function findQuizByLessonId(lessonId: string) {
  return prisma.quiz.findUnique({
    where: { lessonId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { answers: { orderBy: { order: "asc" } } },
      },
    },
  });
}

export async function findQuestionById(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: { answers: { orderBy: { order: "asc" } } },
  });
}

/**
 * Квіз має унікальний `lessonId` (1-до-1 з уроком) — якщо його ще нема
 * (перше питання цього уроку), створює порожній `Quiz` перед доданням
 * питання. Потрібно для `createQuestion` у `service.ts` (адмін додає
 * перше питання уроку "з нуля", без окремого кроку "спочатку створи квіз").
 */
export async function getOrCreateQuizForLesson(lessonId: string) {
  const existing = await prisma.quiz.findUnique({ where: { lessonId } });
  if (existing) return existing;

  return prisma.quiz.create({ data: { lessonId } });
}

/** Найбільший `order` серед питань квізу (для авто-нумерації нового питання). */
export async function findMaxQuestionOrder(quizId: string): Promise<number> {
  const lastQuestion = await prisma.question.findFirst({
    where: { quizId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return lastQuestion?.order ?? 0;
}

export interface CreateAnswerData {
  text: string;
  isCorrect: boolean;
}

export interface CreateQuestionData {
  quizId: string;
  order: number;
  type: string;
  text: string;
  imageUrl?: string | null;
  answers: CreateAnswerData[];
}

export async function createQuestion(data: CreateQuestionData) {
  return prisma.question.create({
    data: {
      quizId: data.quizId,
      order: data.order,
      type: data.type,
      text: data.text,
      imageUrl: data.imageUrl ?? null,
      answers: {
        create: data.answers.map((answer, index) => ({
          order: index + 1,
          text: answer.text,
          isCorrect: answer.isCorrect,
        })),
      },
    },
    include: { answers: { orderBy: { order: "asc" } } },
  });
}

export interface UpdateQuestionData {
  type?: string;
  text?: string;
  imageUrl?: string | null;
  answers?: CreateAnswerData[];
}

/**
 * Оновлює питання. Якщо передано `answers` — ЗАМІНЮЄ ввесь набір
 * відповідей (видаляє старі, створює нові з переданого масиву; каскад із
 * Prisma-схеми (`Answer.questionId onDelete: Cascade`) сам прибере старі
 * при видаленні питання, але тут видаляємо явно, точково, не чіпаючи саме
 * питання) — простіше й надійніше за поштучний diff при редагуванні
 * варіантів у формі адмінки.
 */
export async function updateQuestion(id: string, data: UpdateQuestionData) {
  if (data.answers) {
    await prisma.answer.deleteMany({ where: { questionId: id } });
  }

  return prisma.question.update({
    where: { id },
    data: {
      type: data.type,
      text: data.text,
      imageUrl: data.imageUrl,
      ...(data.answers && {
        answers: {
          create: data.answers.map((answer, index) => ({
            order: index + 1,
            text: answer.text,
            isCorrect: answer.isCorrect,
          })),
        },
      }),
    },
    include: { answers: { orderBy: { order: "asc" } } },
  });
}

export async function deleteQuestion(id: string) {
  return prisma.question.delete({ where: { id } });
}

/** Перезаписує `order` питань квізу згідно з новою послідовністю (той самий підхід, що й `reorderLessons` у `modules/lessons`). */
export async function reorderQuestions(orderedQuestionIds: string[]) {
  await prisma.$transaction(
    orderedQuestionIds.map((id, index) =>
      prisma.question.update({
        where: { id },
        data: { order: index + 1 },
      }),
    ),
  );
}

/**
 * Записує фінальний результат квізу для ЗАЛОГІНЕНОГО користувача (задача
 * 6.7) — `Progress` (userId + lessonId, унікальна пара). Гості проходять
 * квіз без запису сюди — їхній результат зберігається в `localStorage`
 * через `useProgress`/`localProgress.ts` (Фаза 5), не тут.
 *
 * `Progress` концептуально належить майбутньому `modules/progress` (Фаза
 * 7, який ще не існує) — цей єдиний upsert-запит тимчасово живе тут, той
 * самий підхід, що вже застосований у `modules/lessons/repository.ts`
 * (`findCompletedLessonIdsForUser`).
 */
export async function upsertLessonQuizProgress(
  userId: string,
  lessonId: string,
  score: number,
  total: number,
) {
  return prisma.progress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: {
      userId,
      lessonId,
      completed: true,
      quizScore: score,
      quizTotal: total,
      completedAt: new Date(),
    },
    update: {
      completed: true,
      quizScore: score,
      quizTotal: total,
      completedAt: new Date(),
    },
  });
}

/**
 * `courseId` уроку — потрібно тригеру нарахування балів (задача 6.6.5),
 * щоб після завершення уроку перевірити, чи не завершено щойно ввесь
 * курс. Той самий тимчасовий підхід, що й `upsertLessonQuizProgress` вище
 * — до появи `modules/progress`/`modules/courses`-агрегатів.
 */
export async function findLessonCourseId(lessonId: string): Promise<string | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true },
  });
  return lesson?.courseId ?? null;
}

export interface CourseCompletionCounts {
  total: number;
  completed: number;
}

/**
 * Скільки всього уроків у курсі і скільки з них цей користувач ПРОЙШОВ
 * (`Progress.completed = true`) — для тригера нарахування +5 балів за
 * курс (задача 6.6.5): курс вважається завершеним, коли `completed >=
 * total` (і `total > 0`).
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
