import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminLessonsTable } from "@/components/admin/AdminLessonsTable";
import { Button } from "@/components/ui/Button";
import { GraduationCapIcon } from "@/components/ui/icons";
import { getCourseByIdService } from "@/modules/courses";
import { listLessonsService } from "@/modules/lessons";

/**
 * Список уроків курсу в адмінці (задача 0.13.4 → 8.2.1, підключено до
 * реальних даних), за мокапом `adminPanel.png`: №/Назва/Тривалість.
 *
 * Перетворено на Server Component — `getCourseByIdService`/
 * `listLessonsService` (`modules/lessons`, уже сортує за `order` в
 * `repository.ts`: `orderBy: { order: "asc" }`, задача 3.7) вантажаться
 * на сервері. Інтерактивна частина (реордеринг — 8.2.4, видалення —
 * 8.2.5) — у клієнтському `AdminLessonsTable` (той самий "острівець"-підхід,
 * що й `AdminCoursesTable`).
 */
export default async function AdminCourseLessonsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseByIdService(courseId);

  if (!course) notFound();

  const lessons = await listLessonsService(courseId);

  return (
    <div>
      <AdminPageHeader
        title="Уроки курсу"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: course.title, href: `/admin/courses/${course.id}` },
          { label: "Уроки" },
        ]}
        action={
          <Link href={`/admin/courses/${course.id}/lessons/new`}>
            <Button size="sm" icon={<GraduationCapIcon size={16} />} iconPosition="left">
              Додати урок
            </Button>
          </Link>
        }
      />

      <AdminLessonsTable courseId={course.id} initialLessons={lessons} />
    </div>
  );
}
