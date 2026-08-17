import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEditQuestionForm } from "@/components/admin/AdminEditQuestionForm";
import { getCourseByIdService } from "@/modules/courses";
import { getLessonByIdService } from "@/modules/lessons";
import { getQuestionByIdService } from "@/modules/quizzes";

/**
 * Сторінка редагування питання квізу (задачі 8.4.4, 8.4.6).
 * Server Component — вантажить курс, урок і питання з БД та передає в `AdminEditQuestionForm`.
 */
export default async function AdminEditQuestionPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string; questionId: string }>;
}) {
  const { courseId, lessonId, questionId } = await params;

  const course = await getCourseByIdService(courseId);
  const lesson = await getLessonByIdService(lessonId);
  const question = await getQuestionByIdService(questionId);

  if (!course || !lesson || lesson.courseId !== courseId || !question) {
    notFound();
  }

  const quizHref = `/admin/courses/${course.id}/lessons/${lesson.id}/quiz`;

  return (
    <div>
      <AdminPageHeader
        title="Редагування питання"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: course.title, href: `/admin/courses/${course.id}` },
          { label: "Уроки", href: `/admin/courses/${course.id}/lessons` },
          { label: "Квіз", href: quizHref },
          { label: "Редагування" },
        ]}
      />

      <div className="max-w-xl rounded-2xl border border-rose-line/40 bg-white p-6">
        <AdminEditQuestionForm
          courseId={course.id}
          lessonId={lesson.id}
          question={question}
        />
      </div>
    </div>
  );
}
