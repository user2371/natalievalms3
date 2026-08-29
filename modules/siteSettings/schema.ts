import { z } from "zod";

/**
 * `modules/siteSettings/schema.ts` (задача HOME+.1.1).
 *
 * Сайтові налаштування — однорядкова (singleton) таблиця `SiteSettings`
 * (`prisma/schema.prisma`, задача HOME+.0.1). Наразі містить лише вибір
 * "курсу на головній сторінці" (featured course, задача 0.20/HOME+) —
 * реальне server-side збереження замість попереднього
 * `localStorage`-proof-of-concept (`lib/progress/localFeaturedCourse.ts`,
 * прибраного в HOME+.7).
 */

export const SetFeaturedCourseSchema = z.object({
  courseId: z.string().trim().min(1, "Не вказано ID курсу"),
});
export type SetFeaturedCourseInput = z.infer<typeof SetFeaturedCourseSchema>;

/** Форма рядка налаштувань, яку повертає `repository`/`service` (дзеркалить Prisma `SiteSettings`). */
export interface SiteSettings {
  id: string;
  featuredCourseId: string | null;
  updatedAt: Date;
}
