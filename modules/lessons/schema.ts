import { z } from "zod";
import { isYoutubeUrl } from "@/lib/youtube";

/**
 * `modules/lessons/schema.ts` (задача 3.6).
 *
 * `order` навмисно НЕ входить у `CreateLessonSchema` — при створенні
 * призначається автоматично сервісом як "останній + 1" у межах курсу
 * (задача 3.8/3.9). Зміна порядку — окрема дія `reorderLessons`
 * (задача 3.7/3.9, drag-and-drop у списку уроків адмінки), а не звичайний
 * `update`.
 *
 * `courseId` — лише при створенні (до якого курсу додається урок);
 * `UpdateLessonSchema` його не приймає — перенесення уроку між курсами не
 * підтримується (той самий підхід, що зі стабільним `slug` курсу —
 * навмисне обмеження задачі, а не недогляд).
 */
export const CreateLessonSchema = z
  .object({
    courseId: z.string().min(1, "Не вказано ID курсу"),
    title: z.string().trim().min(3, "Назва уроку має містити мінімум 3 символи"),
    duration: z.string().trim().optional().nullable(),
    videoProvider: z.enum(["YOUTUBE", "CUSTOM"]).default("YOUTUBE"),
    videoUrl: z.string().trim().min(1, "Посилання на відео обов'язкове"),
  })
  .refine((data) => data.videoProvider !== "YOUTUBE" || isYoutubeUrl(data.videoUrl), {
    message: "Некоректне посилання на YouTube-відео",
    path: ["videoUrl"],
  });

export const UpdateLessonSchema = z
  .object({
    id: z.string().min(1, "Не вказано ID уроку"),
    title: z
      .string()
      .trim()
      .min(3, "Назва уроку має містити мінімум 3 символи")
      .optional(),
    duration: z.string().trim().optional().nullable(),
    videoProvider: z.enum(["YOUTUBE", "CUSTOM"]).optional(),
    videoUrl: z.string().trim().min(1, "Посилання на відео обов'язкове").optional(),
  })
  .refine(
    (data) =>
      data.videoProvider !== "YOUTUBE" || !data.videoUrl || isYoutubeUrl(data.videoUrl),
    {
      message: "Некоректне посилання на YouTube-відео",
      path: ["videoUrl"],
    },
  );

/** Новий порядок уроків курсу — масив ID у бажаній послідовності (задача 3.7/3.9). */
export const ReorderLessonsSchema = z.object({
  courseId: z.string().min(1, "Не вказано ID курсу"),
  orderedLessonIds: z
    .array(z.string().min(1))
    .min(1, "Список уроків не може бути порожнім"),
});

export type CreateLessonInput = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonInput = z.infer<typeof UpdateLessonSchema>;
export type ReorderLessonsInput = z.infer<typeof ReorderLessonsSchema>;

/** Форма уроку, яку повертає `repository`/`service` (дзеркалить модель Prisma `Lesson`). */
export interface Lesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  duration: string | null;
  videoProvider: string;
  videoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
