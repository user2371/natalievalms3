import { getCourseByIdService } from "@/modules/courses";
import type { Course } from "@/modules/courses";
import * as repository from "./repository";

/**
 * `modules/siteSettings/service.ts` (задача HOME+.1.3) — бізнес-логіка
 * поверх `repository.ts`. `actions.ts` викликає лише функції звідси.
 */

/**
 * Featured-курс для головної сторінки — `null`, якщо налаштування не
 * задане, обраний курс видалено, АБО курс знято з публікації
 * (`published: false`, задача HOME+.1.3: featured-курс, знятий з
 * публікації, не повинен лишатись видимим на лендінгу). У всіх цих
 * випадках лендінг падає на статичний фолбек-контент (`app/page.tsx`).
 */
export async function getFeaturedCourseService(): Promise<Course | null> {
  const settings = await repository.getSiteSettings();
  if (!settings?.featuredCourseId) return null;

  const course = await getCourseByIdService(settings.featuredCourseId);
  if (!course || !course.published) return null;

  return course;
}

/**
 * Перевіряє, що курс існує (сама вибірка курсів у пікері адмінки вже
 * обмежена опублікованими — HOME+.3.1 — тут друга лінія захисту на
 * сервері, той самий принцип "не тільки в UI", що й `assertAdmin`).
 */
export async function setFeaturedCourseService(courseId: string) {
  const course = await getCourseByIdService(courseId);
  if (!course) {
    throw new Error("Курс не знайдено");
  }

  return repository.upsertFeaturedCourseId(courseId);
}

export async function clearFeaturedCourseService() {
  return repository.upsertFeaturedCourseId(null);
}
