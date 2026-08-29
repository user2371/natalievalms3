import { prisma } from "@/lib/prisma";
import type { SiteSettings } from "./schema";

/**
 * `modules/siteSettings/repository.ts` (задача HOME+.1.2) — лише прямі
 * запити до Prisma, без бізнес-логіки (та сама валідація "курс існує й
 * опублікований" — у `service.ts`, задача HOME+.1.3).
 */

const SINGLETON_ID = "singleton";

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return prisma.siteSettings.findUnique({ where: { id: SINGLETON_ID } });
}

/**
 * `upsert` — рядка налаштувань може ще не існувати при першому виборі
 * featured-курсу (новий сайт, ніхто ще нічого не вибирав).
 */
export async function upsertFeaturedCourseId(
  courseId: string | null,
): Promise<SiteSettings> {
  return prisma.siteSettings.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, featuredCourseId: courseId },
    update: { featuredCourseId: courseId },
  });
}
