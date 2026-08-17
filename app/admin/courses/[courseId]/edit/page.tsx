import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEditCourseForm } from "@/components/admin/AdminEditCourseForm";
import { getCourseByIdService } from "@/modules/courses";

/**
 * Редагування курсу (задача 0.13.3 → 8.1.3, підключено до реальних
 * даних). Server Component — `getCourseByIdService` вантажиться на
 * сервері, форма й сам сабміт (`updateCourseAction`) — у клієнтському
 * `AdminEditCourseForm` (той самий підхід, що й
 * `/courses/[slug]/lessons/[lessonId]`, задача 3.15).
 */
export default async function AdminEditCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseByIdService(courseId);

  if (!course) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Редагування курсу"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: course.title, href: `/admin/courses/${course.id}` },
          { label: "Редагування" },
        ]}
      />

      <div className="max-w-xl rounded-2xl border border-rose-line/40 bg-white p-6">
        <AdminEditCourseForm course={course} />
      </div>
    </div>
  );
}
