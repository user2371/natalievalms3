import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminArticleEditor } from "@/components/admin/AdminArticleEditor";
import { getCourseByIdService } from "@/modules/courses";
import { getLessonByIdService } from "@/modules/lessons";
import { getArticleByLessonIdService } from "@/modules/articles";

/**
 * Редактор статті уроку (задача 0.18 → 8.3.1–8.3.5, підключено до
 * реальних даних), той самий вкладений маршрут, що й конструктор квізу —
 * `/admin/courses/[courseId]/lessons/[lessonId]/article` (стаття
 * належить уроку, не самостійна сутність, — див. історію рішення в
 * попередній версії цього файлу, `git`/попередні сесії).
 *
 * **Замінює `ArticleForm.tsx`** (декоративний мокап повноцінного блогу —
 * title/slug/excerpt/категорії/теги/SEO/розклад публікації/підписники) —
 * та форма НЕ відповідає реальній моделі `Article` (`{ id, lessonId,
 * contentJson, updatedAt }`, лише контент, без жодного з цих полів) і
 * лишається зарезервованою для іншої, ще не збудованої фічі (повноцінний
 * блог); тут — реальний `AdminArticleEditor` (Tiptap, задачі 8.3.1–8.3.5),
 * прив'язаний точно до того, що реально зберігається.
 *
 * Server Component — `getLessonByIdService`/`getArticleByLessonIdService`
 * вантажаться на сервері, сам редактор і збереження
 * (`upsertArticleAction`) — у клієнтському `AdminArticleEditor`.
 */
export default async function AdminArticleEditorPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;

  const course = await getCourseByIdService(courseId);
  const lesson = await getLessonByIdService(lessonId);

  if (!course || !lesson || lesson.courseId !== courseId) notFound();

  const article = await getArticleByLessonIdService(lessonId);
  const lessonEditHref = `/admin/courses/${course.id}/lessons/${lesson.id}/edit`;

  return (
    <div>
      <AdminPageHeader
        title="Редактор статті"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: course.title, href: `/admin/courses/${course.id}` },
          { label: "Уроки", href: `/admin/courses/${course.id}/lessons` },
          { label: lesson.title, href: lessonEditHref },
          { label: "Стаття" },
        ]}
      />

      <AdminArticleEditor
        lessonId={lesson.id}
        redirectHref={lessonEditHref}
        initialContentJson={article?.contentJson ?? null}
      />
    </div>
  );
}
