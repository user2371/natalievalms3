import { z } from "zod";

/**
 * `modules/progress/schema.ts` (задача 7.1, доповнено в 7.2–7.10) — типи
 * для Progress-sync при логіні: коли гість із прогресом у `localStorage`
 * (`lib/progress/localProgress.ts`, формат `LessonProgressEntry`/
 * `CourseProgressMap`, не чіпали) логіниться, потрібно змержити цей
 * прогрес із БД. Той самий підхід, що й у `modules/comments/schema.ts`:
 * Zod-схема для валідації вхідних даних server action + TS-інтерфейс, що
 * дзеркалить Prisma `Progress`.
 *
 * ⚠️ `courseId` додано в `UpsertProgressEntrySchema` вже ПІСЛЯ закриття
 * задачі 7.1 (яка сама по собі не уточнювала форму entry) — під час
 * реалізації 7.2/7.3 з'ясувалось, що без нього неможливо ні згрупувати
 * мерж по курсах, ні автоматично створити `Enrollment` (задача 7.10):
 * `localStorage` (`CourseProgressMap`) і так організований per-course
 * (`{ [courseId]: { [lessonId]: entry } }`), тож `courseId` — природна
 * частина кожного запису, а не додаткове поле "про запас".
 */

/**
 * Один урок з `localStorage` для мержу (задача 7.3: "для кожного lessonId
 * з localStorage порівняти з БД, взяти кращий результат"). `updatedAt` —
 * ISO-рядок з `LessonProgressEntry.updatedAt` (той самий формат, не
 * `Date` — лишається JSON-серіалізовним через мережу до server action).
 */
export const UpsertProgressEntrySchema = z.object({
  courseId: z.string().min(1, "Не вказано ID курсу"),
  lessonId: z.string().min(1, "Не вказано ID уроку"),
  completed: z.boolean(),
  quizScore: z.number().int().nullable().optional(),
  quizTotal: z.number().int().nullable().optional(),
  updatedAt: z.string().min(1, "Не вказано дату оновлення"),
});

export const UpsertProgressInputSchema = z.object({
  entries: z
    .array(UpsertProgressEntrySchema)
    .min(1, "Немає записів прогресу для синхронізації"),
});

export type UpsertProgressEntry = z.infer<typeof UpsertProgressEntrySchema>;
export type UpsertProgressInput = z.infer<typeof UpsertProgressInputSchema>;

/** Форма прогресу уроку, яку повертає `repository`/`service` (дзеркалить Prisma `Progress`). */
export interface Progress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  quizScore: number | null;
  quizTotal: number | null;
  completedAt: Date | null;
}
