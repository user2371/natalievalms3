import { z } from "zod";

/**
 * `modules/quizzes/schema.ts` (задача 6.1).
 *
 * Питання створюється РАЗОМ зі своїми варіантами відповідей в одному
 * виклику (`CreateQuestionSchema.answers`) — так природніше для форми
 * адмінки (задача 6.20: одна форма "текст питання + варіанти відповідей"),
 * ніж окремі кроки "створити питання" → "додати відповідь" → ... .
 * `UpdateQuestionSchema` так само замінює ВЕСЬ набір відповідей питання
 * одразу (простіше й надійніше, ніж інкрементальні патчі окремих
 * відповідей при зміні порядку/додаванні/видаленні варіантів у формі).
 *
 * `type` ("TEXT" | "IMAGE") і "single vs multiple choice" — це РІЗНІ речі:
 * `type` визначає, чи є картинка над текстом питання (задачі 6.14/6.15).
 * "Single чи multiple" НЕ зберігається окремим полем — виводиться з
 * кількості `isCorrect: true` серед відповідей (0 чи 1 → radio, 2+ →
 * checkbox), той самий принцип, що вже застосований у статичному
 * `QuizQuestion.multiple` (`lib/data/lessons.ts`) і `QuizBlock.tsx`
 * (обидва не чіпали — переюзані як є, без змін).
 */
export const CreateAnswerSchema = z.object({
  text: z.string().trim().min(1, "Текст відповіді не може бути порожнім"),
  isCorrect: z.boolean().default(false),
});

export const CreateQuestionSchema = z
  .object({
    lessonId: z.string().min(1, "Не вказано ID уроку"),
    type: z.enum(["TEXT", "IMAGE"]).default("TEXT"),
    text: z.string().trim().min(1, "Текст питання не може бути порожнім"),
    imageUrl: z.string().trim().url("Некоректний URL картинки").optional().nullable(),
    answers: z
      .array(CreateAnswerSchema)
      .min(2, "Питання має містити мінімум 2 варіанти відповіді"),
  })
  .refine((data) => data.answers.some((answer) => answer.isCorrect), {
    message: "Хоча б один варіант має бути позначений правильним",
    path: ["answers"],
  });

export const UpdateQuestionSchema = z
  .object({
    id: z.string().min(1, "Не вказано ID питання"),
    type: z.enum(["TEXT", "IMAGE"]).optional(),
    text: z.string().trim().min(1, "Текст питання не може бути порожнім").optional(),
    imageUrl: z.string().trim().url("Некоректний URL картинки").optional().nullable(),
    answers: z
      .array(CreateAnswerSchema)
      .min(2, "Питання має містити мінімум 2 варіанти відповіді")
      .optional(),
  })
  .refine((data) => !data.answers || data.answers.some((answer) => answer.isCorrect), {
    message: "Хоча б один варіант має бути позначений правильним",
    path: ["answers"],
  });

/** Новий порядок питань квізу — масив ID у бажаній послідовності. */
export const ReorderQuestionsSchema = z.object({
  lessonId: z.string().min(1, "Не вказано ID уроку"),
  orderedQuestionIds: z
    .array(z.string().min(1))
    .min(1, "Список питань не може бути порожнім"),
});

/** Відповідь(і) користувача на одне питання — для перевірки (задача 6.3/6.6). */
export const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedAnswerIds: z.array(z.string().min(1)),
});

/** Фінальний результат проходження квізу залогіненим користувачем (задача 6.7). */
export const SubmitQuizResultSchema = z.object({
  lessonId: z.string().min(1),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
});

export type CreateAnswerInput = z.infer<typeof CreateAnswerSchema>;
export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionSchema>;
export type ReorderQuestionsInput = z.infer<typeof ReorderQuestionsSchema>;
export type SubmitAnswerInput = z.infer<typeof SubmitAnswerSchema>;
export type SubmitQuizResultInput = z.infer<typeof SubmitQuizResultSchema>;

/** Форма відповіді, яку повертає `repository`/`service` (дзеркалить модель Prisma `Answer`). */
export interface Answer {
  id: string;
  questionId: string;
  order: number;
  text: string;
  isCorrect: boolean;
}

/** Форма питання (дзеркалить модель Prisma `Question`, з уже підвантаженими відповідями). */
export interface Question {
  id: string;
  quizId: string;
  order: number;
  type: string;
  text: string;
  imageUrl: string | null;
  answers: Answer[];
}

/** Форма квізу (дзеркалить модель Prisma `Quiz`, з уже підвантаженими питаннями). */
export interface Quiz {
  id: string;
  lessonId: string;
  createdAt: Date;
  questions: Question[];
}
