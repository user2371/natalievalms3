import type { MetadataRoute } from "next";

/**
 * `app/robots.ts` (Next.js App Router конвенція) — генерує `/robots.txt`.
 * Дублює per-page `robots: { index: false }` (задача 9.16: `/admin`,
 * `/profile`, `/settings`, `/lessons`) навмисно — `robots.txt` краулер
 * перевіряє ДО заходу на сторінку (економить бюджет сканування), а
 * per-page `<meta name="robots">` — підстраховка, якщо конкретний URL
 * десь проскочив повз `Disallow`-правило нижче.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/profile", "/settings", "/lessons", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
