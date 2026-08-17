import type { MetadataRoute } from "next";
import { listCoursesService } from "@/modules/courses";

/**
 * `app/sitemap.ts` (Next.js App Router конвенція) — генерує `/sitemap.xml`.
 * Лише ПУБЛІЧНІ, призначені для індексації сторінки (той самий перелік
 * "дозволено", що й у `app/robots.ts` — не дублюємо `/admin`, `/profile`,
 * `/settings`, `/lessons`). Динамічні курси — лише `publishedOnly: true`
 * (той самий фільтр, що вже застосовується на `/courses`, задача 3.x) —
 * неопубліковані курси не мають з'являтись у пошуковій видачі.
 *
 * ⚠️ `/users/[id]` (публічні профілі) і `/courses/[slug]/lessons/[lessonId]`
 * (реальні уроки) свідомо НЕ перелічуються поіменно — профілів/уроків може
 * бути дуже багато, і для обох достатньо, що на них ведуть звичайні
 * внутрішні посилання (краулер і так їх знайде переходами) — той самий
 * мінімалізм, що прийнятний для сайту цього масштабу.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/leaderboard`, changeFrequency: "daily", priority: 0.5 },
  ];

  const courses = await listCoursesService(true).catch(() => []);
  const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...courseRoutes];
}
