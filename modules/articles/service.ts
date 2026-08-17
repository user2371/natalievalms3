import { UpsertArticleInput, UpsertArticleSchema } from "./schema";
import * as repository from "./repository";

/**
 * `modules/articles/service.ts` — бізнес-логіка та валідація поверх
 * `repository.ts`, той самий поділ, що й у решті модулів.
 */

export async function getArticleByLessonIdService(lessonId: string) {
  return repository.findByLessonId(lessonId);
}

/** Задача 8.3.3: upsert статті по lessonId. */
export async function upsertArticleService(input: UpsertArticleInput) {
  const parsed = UpsertArticleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані статті");
  }

  return repository.upsert(parsed.data.lessonId, parsed.data.contentJson);
}
