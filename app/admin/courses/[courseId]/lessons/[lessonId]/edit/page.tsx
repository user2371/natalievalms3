import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminEditLessonForm } from "@/components/admin/AdminEditLessonForm";
import { getLessonByIdService } from "@/modules/lessons";
import { getHomeworkAssignmentByLessonIdService } from "@/modules/homeworkAssignments";
import { getArticleByLessonIdService } from "@/modules/articles";
import { getQuizQuestionsForLessonService } from "@/modules/quizzes";

/**
 * Редагування уроку (задача 0.13.5 → 8.2.3, підключено до реальних
 * даних: title, duration, videoProvider, videoUrl). Server Component —
 * `getLessonByIdService` вантажиться на сервері, форма й сабміт
 * (`updateLessonAction`) — у клієнтському `AdminEditLessonForm`.
 *
 * ФАЗА HW+, задача HW+.3.3 (28.08.2026): додано
 * `getHomeworkAssignmentByLessonIdService`, щоб кнопка "Додати ДЗ"/
 * "Редагувати ДЗ" у `LessonForm` показувала правильний напис за
 * наявністю вже збереженого опису завдання.
 *
 * ФАЗА IND+, задача IND+.3 (29.08.2026): той самий принцип поширено на
 * статтю й квіз — додано `getArticleByLessonIdService`/
 * `getQuizQuestionsForLessonService`, щоб `LessonForm` показувала
 * правильний напис кнопки й бейдж "Додано" для всіх трьох блоків
 * (стаття/квіз/ДЗ), а не лише для ДЗ. `hasArticle` — та сама перевірка
 * "непорожня стаття" (`article.contentJson.trim()`), що вже на сторінці
 * уроку студента. `hasQuiz` — `Boolean(quizQuestions)`, бо
 * `getQuizQuestionsForLessonService` вже повертає `null`, коли квізу
 * немає або в ньому нуль питань (той самий принцип "квіз без питань =
 * вважати відсутнім", що й на самій сторінці проходження квізу).
 */
export default async function AdminEditLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const lesson = await getLessonByIdService(lessonId);

  if (!lesson || lesson.courseId !== courseId) notFound();

  const [homeworkAssignment, article, quizQuestions] = await Promise.all([
    getHomeworkAssignmentByLessonIdService(lessonId),
    getArticleByLessonIdService(lessonId),
    getQuizQuestionsForLessonService(lessonId),
  ]);

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
          hasQuiz={Boolean(quizQuestions)}
          articleHref={`/admin/courses/${courseId}/lessons/${lesson.id}/article`}
          hasArticle={Boolean(article && article.contentJson.trim())}
          homeworkHref={`/admin/courses/${courseId}/lessons/${lesson.id}/homework`}
          hasHomeworkAssignment={Boolean(
            homeworkAssignment &&
              ((homeworkAssignment.contentJson && homeworkAssignment.contentJson.trim()) ||
                homeworkAssignment.videoUrl),
          )}
        />
      </div>
    </div>
  );
}
