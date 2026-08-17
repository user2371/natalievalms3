import { Spinner } from "@/components/ui/Spinner";

/**
 * Глобальний преloader (App Router `loading.tsx`). Next.js сам показує
 * цей файл замість дочірньої сторінки, поки та вантажиться (наприклад,
 * поки async server-компонент — `app/page.tsx`, `app/courses/page.tsx`,
 * `app/courses/[slug]/page.tsx`, `app/courses/[slug]/lessons/[lessonId]/page.tsx`,
 * `app/leaderboard/page.tsx` — робить запити до БД через
 * `listCoursesService`/`listLessonsService`/тощо). Діє для будь-якого
 * маршруту без власного `loading.tsx` (окрім `/admin/*`, де є окремий
 * `app/admin/loading.tsx`).
 */
export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-3 bg-cream">
      <Spinner size="lg" />
      <p className="text-sm text-ink/60">Завантаження...</p>
    </div>
  );
}
