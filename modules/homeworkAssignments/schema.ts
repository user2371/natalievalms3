import { z } from "zod";

/**
 * `modules/homeworkAssignments/schema.ts` — ФАЗА HW+, задача HW+.1.1
 * (28.08.2026).
 *
 * ОКРЕМИЙ модуль від `modules/homework` (яка керує `HomeworkSubmission`
 * — здачею студентом свого відео). Тут — опис самого завдання, який
 * пише адмін ДО будь-якої здачі: `HomeworkAssignment` (`{ id, lessonId,
 * contentJson, videoUrl, updatedAt }`), той самий поділ на
 * schema/repository/service/actions/index, що й у решті модулів.
 *
 * **Відкрите питання про відео-провайдер — ВИРІШЕНО (28.08.2026, за
 * прямим підтвердженням користувача):** відео-інструкція до ДЗ
 * валідується як YouTube-посилання, той самий підхід, що для ВСІХ
 * інших відео в проєкті (`Lesson.videoUrl`, `HomeworkSubmission.videoUrl`).
 * Якщо згодом знадобиться довільний хостинг — окрема майбутня задача.
 */

/** Порожній рядок нормалізується в `null` у `service.ts` (той самий принцип, що вже в `modules/account/schema.ts` для `bio`). */
export const UpsertHomeworkAssignmentSchema = z.object({
  lessonId: z.string().min(1, "Не вказано ID уроку"),
  contentJson: z.string().nullable(),
  videoUrl: z.string().nullable(),
});

export type UpsertHomeworkAssignmentInput = z.infer<typeof UpsertHomeworkAssignmentSchema>;

/** Форма опису завдання, яку повертає `repository`/`service` (дзеркалить Prisma-модель `HomeworkAssignment`). */
export interface HomeworkAssignment {
  id: string;
  lessonId: string;
  contentJson: string | null;
  videoUrl: string | null;
  updatedAt: Date;
}

/**
 * HW+.0.4 — той самий набір MIME-типів, що `CERTIFICATE_ALLOWED_MIME_TYPES`
 * (jpeg/png/webp), але СВОЯ константа — окремий модуль, окремі ліміти,
 * не переюзана напряму.
 */
export const HOMEWORK_IMAGE_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type HomeworkImageAllowedMimeType = (typeof HOMEWORK_IMAGE_ALLOWED_MIME_TYPES)[number];

/**
 * HW+.0.4 — 5MB: контентне зображення всередині тексту завдання, ближче
 * за призначенням до аватарки, ніж до 10MB-скана сертифіката.
 */
export const HOMEWORK_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
