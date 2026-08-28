import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminHomeworkEditor } from "@/components/admin/AdminHomeworkEditor";
import { getCourseByIdService } from "@/modules/courses";
import { getLessonByIdService } from "@/modules/lessons";
import { getHomeworkAssignmentByLessonIdService } from "@/modules/homeworkAssignments";

/**
 * Редактор домашнього завдання уроку (ФАЗА HW+, задача HW+.3.2,
 * 28.08.2026) — 1:1 структура сусіднього `.../article/page.tsx`
 * (вкладений маршрут, ДЗ належить уроку, не самостійна сутність).
 *
 * Server Component — `getCourseByIdService`/`getLessonByIdService`/
 * `getHomeworkAssignmentByLessonIdService` вантажаться на сервері, сам
 * редактор і збереження (`upsertHomeworkAssignmentAction`) — у
 * клієнтському `AdminHomeworkEditor`.
 */
export default async function AdminHomeworkEditorPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;

  const course = await getCourseByIdService(courseId);
  const lesson = await getLessonByIdService(lessonId);

  if (!course || !lesson || lesson.courseId !== courseId) notFound();

  const assignment = await getHomeworkAssignmentByLessonIdService(lessonId);
  const lessonEditHref = `/admin/courses/${course.id}/lessons/${lesson.id}/edit`;

  return (
    <div>
      <AdminPageHeader
        title="Редактор домашнього завдання"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: course.title, href: `/admin/courses/${course.id}` },
          { label: "Уроки", href: `/admin/courses/${course.id}/lessons` },
          { label: lesson.title, href: lessonEditHref },
          { label: "Домашнє завдання" },
        ]}
      />

      <AdminHomeworkEditor
        lessonId={lesson.id}
        redirectHref={lessonEditHref}
        initialContentJson={assignment?.contentJson ?? null}
        initialVideoUrl={assignment?.videoUrl ?? null}
      />
    </div>
  );
}
