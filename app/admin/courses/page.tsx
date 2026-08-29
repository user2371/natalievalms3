import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCoursesTable } from "@/components/admin/AdminCoursesTable";
import { FeaturedCoursePicker } from "@/components/admin/FeaturedCoursePicker";
import { Button } from "@/components/ui/Button";
import { GraduationCapIcon } from "@/components/ui/icons";
import { listCoursesService } from "@/modules/courses";
import { getFeaturedCourseAction } from "@/modules/siteSettings";
export const dynamic = 'force-dynamic';
/**
 * Список курсів в адмінці (задача 0.13.2 → 8.1.1, підключено до реальних
 * даних), за мокапом `adminPanel.png`: таблиця Назва/Slug/Опубліковано/Дії,
 * кнопка "+ Додати курс", пагінація, іконки редагування/видалення з
 * підтвердженням (0.13.11 → 8.1.5, з попередженням про каскад).
 *
 * Перетворено на Server Component (той самий фікс, що й для `/courses` у
 * задачі 3.21): `listCoursesService()` — БЕЗ `publishedOnly` (адмін бачить
 * і чернетки), рендериться на сервері. Інтерактивна частина (перемикач
 * "Опубліковано" — 8.1.4, видалення — 8.1.5, пагінація) — у клієнтському
 * `AdminCoursesTable` (той самий "острівець"-підхід, що й
 * `RealCommentsBlock`). ⚠️ Колонку "Уроків" (була в демо-версії) прибрано —
 * реальний `Course` не містить лічильника уроків без окремого запиту на
 * кожен курс; додати можна пізніше окремим кроком, не входило в 8.1.1
 * буквально ("реальні дані, статус published/draft").
 *
 * 19.07.2026, сесія 17 → 29.08.2026, ФАЗА HOME+: над таблицею — блок
 * "Курс на головній сторінці" (задача 0.20), винесений у
 * `FeaturedCoursePicker` (клієнтський "острівець"). Раніше
 * вибір зберігався лише в `localStorage`/Redux
 * (`useFeaturedCourse`) і пропонував статичний демо-каталог
 * `lib/data/courses.ts`; тепер — реальні курси (`modules/courses`, ті
 * самі `courses`, що вже завантажені тут для таблиці) і
 * сервербек `modules/siteSettings`
 * (`SiteSettings.featuredCourseId`) — вибір видимий усім
 * відвідувачам сайту, а не лише в браузері адміна.
 */
export default async function AdminCoursesPage() {
  const courses = await listCoursesService();
  const featuredCourse = await getFeaturedCourseAction();

  return (
    <div>
      <AdminPageHeader
        title="Список курсів"
        breadcrumb={[{ label: "Головна", href: "/admin/courses" }, { label: "Курси" }]}
        action={
          <Link href="/admin/courses/new">
            <Button size="sm" icon={<GraduationCapIcon size={16} />} iconPosition="left">
              Додати курс
            </Button>
          </Link>
        }
      />

      <FeaturedCoursePicker
        courses={courses}
        featuredCourseId={featuredCourse?.id ?? null}
      />

      <AdminCoursesTable initialCourses={courses} />
    </div>
  );
}
