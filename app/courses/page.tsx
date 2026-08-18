import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { CoursesCatalogClient } from "@/components/course/CoursesCatalogClient";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { listCoursesService } from "@/modules/courses";
import { listLessonsService } from "@/modules/lessons";
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: "Каталог курсів",
  description:
    "Усі курси манікюру Natalieva: гель-лак для новачків, дизайн нігтів, нарощування та інші напрямки навчання.",
};

/**
 * Каталог курсів (`/courses`), за мокапом `mockup-01-courses.html`. Реально
 * готовий курс — "Гель-лак для новачків" (перша картка); решта — макетні
 * картки "Незабаром" до появи відповідних реальних курсів у БД.
 *
 * Задача 0.11 у `TASKS_DETAILED.md` — окремий, застарілий опис цієї самої
 * сторінки (той самий мокап `mockup-01-courses.html`, ті самі пункти:
 * заголовок, фільтри, сітка карток, адаптив, роутинг), написаний ще до
 * сесії 0.6a (13.07.2026), яка й побудувала все перелічене вище. 0.11.1,
 * 0.11.2, 0.11.3, 0.11.5, 0.11.6 — фактично вже виконані як 0.6a.2–0.6a.5;
 * єдине, чого справді бракувало — 0.11.4 (empty state "Курсів поки немає"
 * для фільтра без результатів). Додано 17.07.2026, сесія 7.
 *
 * 24.07.2026, задача 3.21: перетворено на Server Component (той самий фікс,
 * що й для `app/page.tsx` у 3.11, — `Header` без переданих `user`/
 * `onLogout` сам читає сесію). Завантажує реальні курси з БД
 * (`listCoursesService(true)`) і передає в клієнтський
 * `CoursesCatalogClient` (фільтри лишились інтерактивними, тому саме той
 * підкомпонент і далі `"use client"`) — картки статичних курсів з
 * відповідником у БД тепер ведуть на реальний `/courses/[slug]` замість
 * хардкоду `/lessons`; реальні курси без відповідника серед статичних
 * додаються в кінець сітки окремими картками.
 */
export default async function CoursesPage() {
  const realCourses = await listCoursesService(true).catch(() => []);
  const realLessonCountsByCourseId = await Promise.all(
    realCourses.map(
      async (course) =>
        [course.id, (await listLessonsService(course.id)).length] as const,
    ),
  )
    .then((entries) => Object.fromEntries(entries))
    .catch(() => ({}));

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent-dark"
          >
            <ArrowLeftIcon size={16} />
            На головну
          </Link>

          <div className="mx-auto mt-6 max-w-xl text-center">
            <h1 className="font-serif text-3xl text-ink sm:text-4xl">Каталог курсів</h1>
            <p className="mt-2.5 text-sm text-muted sm:text-base">
              Обирай напрямок і навчайся у зручному темпі — від перших кроків у манікюрі
              до просунутого дизайну.
            </p>
          </div>

          <CoursesCatalogClient
            realCourses={realCourses}
            realLessonCountsByCourseId={realLessonCountsByCourseId}
          />
        </div>
      </main>
    </div>
  );
}
