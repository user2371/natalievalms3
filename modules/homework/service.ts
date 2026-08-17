import { isYoutubeUrl } from "@/lib/youtube";
import { SubmitHomeworkInput, SubmitHomeworkSchema } from "./schema";
import * as repository from "./repository";

/**
 * `modules/homework/service.ts` — бізнес-логіка та валідація поверх
 * `repository.ts`, той самий поділ, що й у `modules/comments/service.ts`.
 */

export async function getHomeworkForLessonService(lessonId: string, userId: string) {
  return repository.findByLessonAndUser(lessonId, userId);
}

/**
 * Прив'язка до конкретного `userId` (з сесії — перевірка в `actions.ts`,
 * той самий принцип, що й `addCommentService`: service не знає про сесію,
 * лише отримує вже перевірений `userId`). Валідація посилання —
 * той самий `isYoutubeUrl`, що вже в легасі `HomeworkBlock.tsx`.
 */
export async function submitHomeworkService(userId: string, input: SubmitHomeworkInput) {
  const parsed = SubmitHomeworkSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані здачі ДЗ");
  }

  if (!isYoutubeUrl(parsed.data.videoUrl)) {
    throw new Error("Це не схоже на посилання YouTube. Приклад: https://youtu.be/…");
  }

  return repository.upsert({
    lessonId: parsed.data.lessonId,
    userId,
    videoUrl: parsed.data.videoUrl,
  });
}
