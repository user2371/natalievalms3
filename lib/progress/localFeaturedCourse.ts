/**
 * Який курс показувати на головній сторінці (лендінгу) — вибір адміна
 * (задача 0.20, `/admin/courses`), зберігається в `localStorage`, той самий
 * патерн, що й `localSettings.ts`. Реальне збереження на бекенді
 * (`Setting`/`SiteConfig` в Prisma) — Фаза 3+/8, коли з'явиться модуль
 * налаштувань сайту; тут — proof-of-concept на клієнті.
 *
 * Значення — `slug` курсу з `lib/data/courses.ts` (`COURSES`), не `id` з
 * `lib/data/admin.ts` (`ADMIN_COURSES`) — навмисно: адмінка на сьогодні має
 * два непов'язані набори даних курсів (задокументовано в
 * `IMPLEMENTATION_STATUS.md`, аудит 0.13), а на головній сторінці реально
 * рендериться саме `COURSES`. Дропдаун вибору в адмінці показує список із
 * `COURSES`, щоб вибір напряму відповідав тому, що з'явиться на лендінгу.
 */

const FEATURED_COURSE_KEY = "natalieva:admin:featured-course-slug";

/** Повертає збережений slug вибраного курсу, або `null`, якщо ще не вибирали (лендінг тоді бере перший доступний курс). */
export function getFeaturedCourseSlug(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(FEATURED_COURSE_KEY);
  } catch {
    return null;
  }
}

/** Записує вибір адміна — який курс показувати на головній сторінці. */
export function setFeaturedCourseSlug(slug: string) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FEATURED_COURSE_KEY, slug);
  } catch {
    // ігноруємо — localStorage недоступний
  }
}
