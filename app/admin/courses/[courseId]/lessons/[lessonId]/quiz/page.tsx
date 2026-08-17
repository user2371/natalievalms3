import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminQuizQuestionsList } from "@/components/admin/AdminQuizQuestionsList";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/ui/icons";
import { getCourseByIdService } from "@/modules/courses";
import { getLessonByIdService } from "@/modules/lessons";
import {
  getQuizByLessonIdService,
  getQuizQuestionsForLessonService,
} from "@/modules/quizzes";

/**
 * Конструктор квізу — список питань уроку (задача 0.13.8 → 8.4.1,
 * підключено до реальних даних), за мокапом `adminPanel.png`.
 *
 * Server Component — `getQuizByLessonIdService` (реальні `Question[]` з
 * підвантаженими `answers`) і `getQuizQuestionsForLessonService` (той самий
 * адаптер у форму `QuizQuestion[]`, що вже застосований для студентського
 * `QuizBlock.tsx`, задача 6.9/6.10, не чіпали) — обидва вантажаться на
 * сервері. Клієнтський `AdminQuizQuestionsList` — лише перегляд списку +
 * preview-модалка "Переглянути як студент" (реальний `QuizBlock`,
 * перевикористаний без змін).
 *
 * ⚠️ Кнопки перевпорядкування, редагування й видалення питання СВІДОМО
 * ПРИБРАНІ з цієї версії списку — той самий принцип, що й для уроків
 * (задачі 8.2.4/8.2.5, тоді ще не підключених): реальне підключення
 * порядку/видалення це окремі задачі 8.4.5/8.4.6, а редагування взагалі
 * не мало власного пункту в переліку задач 8.4.x (лише 8.4.2 "форма
 * СТВОРЕННЯ") — усі поза межами цього кроку. Лишається лише "+ Додати
 * питання" (задача 8.4.2, реально підключено) і read-only перегляд.
 */
export default async function AdminQuizPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;

  const course = await getCourseByIdService(courseId);
  const lesson = await getLessonByIdService(lessonId);

  if (!course || !lesson || lesson.courseId !== courseId) notFound();

  const quiz = await getQuizByLessonIdService(lessonId);
  const previewQuestions = (await getQuizQuestionsForLessonService(lessonId)) ?? [];
  const questions = quiz?.questions ?? [];

  return (
    <div>
      <AdminPageHeader
        title="Конструктор квізу"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: course.title, href: `/admin/courses/${course.id}` },
          { label: "Уроки", href: `/admin/courses/${course.id}/lessons` },
          {
            label: lesson.title,
            href: `/admin/courses/${course.id}/lessons/${lesson.id}/edit`,
          },
          { label: "Квіз" },
        ]}
        action={
          <Link href={`/admin/courses/${course.id}/lessons/${lesson.id}/quiz/new`}>
            <Button size="sm" icon={<StarIcon size={16} />} iconPosition="left">
              Додати питання
            </Button>
          </Link>
        }
      />

      <AdminQuizQuestionsList
        courseId={courseId}
        lessonId={lessonId}
        lessonTitle={lesson.title}
        questions={questions}
        previewQuestions={previewQuestions}
      />
    </div>
  );
}
