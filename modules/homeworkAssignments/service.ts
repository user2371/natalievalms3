import { isYoutubeUrl } from "@/lib/youtube";
import { UpsertHomeworkAssignmentInput, UpsertHomeworkAssignmentSchema } from "./schema";
import * as repository from "./repository";

/**
 * `modules/homeworkAssignments/service.ts` — ФАЗА HW+, задача HW+.1.3.
 * Бізнес-логіка та валідація поверх `repository.ts`, той самий поділ,
 * що й у решті модулів.
 *
 * READ — для сторінки уроку (студент бачить умову ДЗ) І для адмінського
 * редактора (початкові дані форми), той самий метод для обох.
 */
export async function getHomeworkAssignmentByLessonIdService(lessonId: string) {
  return repository.findByLessonId(lessonId);
}

/**
 * HW+.1.3/HW+.5.3 — `videoUrl`: якщо непорожній, `isYoutubeUrl`-перевірка
 * (той самий підхід і той самий текст помилки, що
 * `modules/homework/service.ts::submitHomeworkService`). Порожній рядок
 * нормалізується в `null` (той самий принцип, що `bio` в
 * `modules/account/schema.ts`).
 */
export async function upsertHomeworkAssignmentService(input: UpsertHomeworkAssignmentInput) {
  const parsed = UpsertHomeworkAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані домашнього завдання");
  }

  const contentJson = parsed.data.contentJson?.trim() || null;
  const videoUrl = parsed.data.videoUrl?.trim() || null;

  if (videoUrl && !isYoutubeUrl(videoUrl)) {
    throw new Error("Це не схоже на посилання YouTube. Приклад: https://youtu.be/…");
  }

  return repository.upsert(parsed.data.lessonId, { contentJson, videoUrl });
}
