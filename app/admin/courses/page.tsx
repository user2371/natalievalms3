import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCoursesTable } from "@/components/admin/AdminCoursesTable";
import { FeaturedCoursePicker } from "@/components/admin/FeaturedCoursePicker";
import { Button } from "@/components/ui/Button";
import { GraduationCapIcon } from "@/components/ui/icons";
import { listCoursesService } from "@/modules/courses";

export const dynamic = "force-dynamic";
/**
 * Список курсів в адмінці (задача 0.13.2 → 8.1.1, підключено до реальних
 * даних),  за мокапом `adminPanel.png`: таблиця Назва/Slug/Опубліковано/Дії,
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
 * 19.07.2026, сесія 17: над таблицею — блок "Курс на головній сторінці"
 * (задача 0.20), винесений у `FeaturedCoursePicker` (клієнтський
 * "острівець", бо use `useFeaturedCourse`/`localStorage`) — той самий
 * `Select` із `COURSES` (публічний демо-каталог лендінгу, `lib/data/courses.ts`,
 * НЕ `modules/courses` — навмисно, бо саме `COURSES` рендериться на
 * лендінгу; два непов'язані набори даних курсів — задокументована раніше
 * проблема, див. `IMPLEMENTATION_STATUS.md`), не чіпали.
 */
export default async function AdminCoursesPage() {
  const courses = await listCoursesService();

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

      <FeaturedCoursePicker />

      <AdminCoursesTable initialCourses={courses} />
    </div>
  );
}
