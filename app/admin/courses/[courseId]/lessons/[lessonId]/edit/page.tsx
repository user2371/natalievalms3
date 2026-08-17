import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEditLessonForm } from "@/components/admin/AdminEditLessonForm";
import { getLessonByIdService } from "@/modules/lessons";

/**
 * Редагування уроку (задача 0.13.5 → 8.2.3, підключено до реальних
 * даних: title, duration, videoProvider, videoUrl). Server Component —
 * `getLessonByIdService` вантажиться на сервері, форма й сабміт
 * (`updateLessonAction`) — у клієнтському `AdminEditLessonForm`.
 */
export default async function AdminEditLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const lesson = await getLessonByIdService(lessonId);

  if (!lesson || lesson.courseId !== courseId) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Редагування уроку"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: "Уроки", href: `/admin/courses/${courseId}/lessons` },
          { label: lesson.title },
        ]}
      />

      <div className="max-w-xl rounded-2xl border border-rose-line/40 bg-white p-6">
        <AdminEditLessonForm
          lesson={lesson}
          quizHref={`/admin/courses/${courseId}/lessons/${lesson.id}/quiz`}
          articleHref={`/admin/courses/${courseId}/lessons/${lesson.id}/article`}
        />
      </div>
    </div>
  );
}
