import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { CourseLessonSidebar } from "@/components/lesson/CourseLessonSidebar";
import { VideoPlayer } from "@/components/lesson/VideoPlayer";
import { LessonCompleteButton } from "@/components/lesson/LessonCompleteButton";
import { GuestProgressBanner } from "@/components/lesson/GuestProgressBanner";
import { RealQuizBlock } from "@/components/lesson/RealQuizBlock";
import { RealCommentsBlock } from "@/components/lesson/RealCommentsBlock";
import { RealHomeworkBlock } from "@/components/lesson/RealHomeworkBlock";
import { ArticleRenderer } from "@/components/lesson/ArticleRenderer";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeftIcon, ArrowRightIcon, DocumentIcon } from "@/components/ui/icons";
import { extractYoutubeId } from "@/lib/youtube";
import { getCourseBySlugService } from "@/modules/courses";
import { getLessonByIdService, listLessonsService } from "@/modules/lessons";
import { getQuizQuestionsForLessonService } from "@/modules/quizzes";
import { getCommentsByLessonIdService } from "@/modules/comments";
import { getArticleByLessonIdService } from "@/modules/articles";
import { getHomeworkForLessonService } from "@/modules/homework";
import { getHomeworkAssignmentByLessonIdService } from "@/modules/homeworkAssignments";

interface CourseLessonPageProps {
  params: Promise<{ slug: string; lessonId: string }>;
}

/**
 * SEO-метадані (задача 3.22) — той самий підхід, що й на `/courses/[slug]`:
 * нейтральний фолбек-заголовок, якщо курс/урок не знайдено, без
 * дублювання перевірки ролі з тіла компонента нижче.
 */
export async function generateMetadata({
  params,
}: CourseLessonPageProps): Promise<Metadata> {
  const { slug, lessonId } = await params;
  const course = await getCourseBySlugService(slug).catch(() => null);
  const lesson = course ? await getLessonByIdService(lessonId).catch(() => null) : null;

  if (!course || !lesson || lesson.courseId !== course.id) {
    return { title: "Урок не знайдено" };
  }

  const lessonDescription = `Урок ${lesson.order} курсу "${course.title}": ${lesson.title}.`;

  return {
    title: `${lesson.title} — ${course.title}`,
    description: lessonDescription,
    openGraph: {
      title: `${lesson.title} — ${course.title}`,
      description: lessonDescription,
      images: course.coverImage ? [{ url: course.coverImage }] : undefined,
    },
  };
}

/**
 * `/courses/[slug]/lessons/[lessonId]` (задача 3.15) — сторінка РЕАЛЬНОГО
 * (Prisma) уроку.
 *
 * 28.08.2026 (ФАЗА HW+, задача HW+.4.3): `RealHomeworkBlock` тепер також
 * отримує `assignment` (`getHomeworkAssignmentByLessonIdService`) —
 * редагований адміном опис ДЗ (текст + відео-інструкція YouTube) окремо
 * на кожен урок, замість статичного `DEFAULT_HOMEWORK_ITEMS`.
 *
 * 01.08.2026 (задача 9.15, виправлення прогалини 1 — реальна здача ДЗ):
 * `RealHomeworkBlock` тепер рендериться (раніше свідомо був виключений —
 * `modules/homework` не існував). Здача відео ДЗ пише напряму в БД через
 * `submitHomeworkAction`, `getHomeworkForLessonService` підвантажує вже
 * здане ДЗ користувача на сервері.
 *
 * 01.08.2026 (задача 9.3, "Empty state: урок без статті"): стаття уроку
 * ТЕПЕР рендериться — `getArticleByLessonIdService` + `ArticleRenderer`
 * (той самий компонент, що вже використовувався лише для попереднього
 * перегляду в адмінці, задача 8.3.5 — саме туди й закладався для цього).
 * Якщо статті немає (`article === null`) або її вміст порожній —
 * показується явний empty state замість того, щоб блок просто зникав.
 *
 * 28.07.2026 (задачі 6.5.6–6.5.15): `CommentsBlock` більше НЕ виключений —
 * коментарі рендеряться через `RealCommentsBlock` (`components/lesson/
 * RealCommentsBlock.tsx`), обгортку над тими самими `CommentForm`/
 * `GuestCommentBanner`/`CommentCard`, що й на статичній сторінці, підключену
 * до реального `modules/comments`. Список завантажується тут на сервері
 * (`getCommentsByLessonIdService`), далі — optimistic UI на клієнті.
 *
 * 25.07.2026, Фаза 6 (задачі 6.9/6.10): `QuizBlock` тепер ПІДКЛЮЧЕНИЙ до
 * реального квізу уроку, якщо він є — `getQuizQuestionsForLessonService`
 * адаптує Prisma `Question`+`Answer` у форму `QuizQuestion[]`, яку вже
 * очікує статичний `QuizBlock.tsx` (ПЕРЕВИКОРИСТАНИЙ без жодних змін —
 * увесь стейт-машин проходження, задача 6.10, уже був готовий з Фази 0).
 * Якщо квізу немає (`quizQuestions === null`) — блок просто не рендериться
 * (задача 6.19, "урок без квізу").
 *
 * 27.07.2026 (задачі 6.17/6.18): рендериться через `RealQuizBlock`
 * (обгортка, `components/lesson/RealQuizBlock.tsx`) — результат тепер
 * РЕАЛЬНО зберігається: гість → `localStorage` (завжди), залогінений →
 * додатково в `Progress` через `submitQuizResultAction`. Деталі правила —
 * у докстрінгу самого `RealQuizBlock.tsx`.
 *
 * 404, якщо курсу/уроку не існує, або урок належить іншому курсу (задача
 * 3.17 — тут лише базовий випадок "не існує", без перевірки `published`,
 * це задача 3.18).
 */
export default async function CourseLessonPage({ params }: CourseLessonPageProps) {
  const { slug, lessonId } = await params;

  const course = await getCourseBySlugService(slug).catch(() => null);
  if (!course) {
    notFound();
  }

  const session = await auth();
  const userId = session?.user?.id;

  // Задача 3.18: той самий принцип, що й на `/courses/[slug]` — уроки
  // неопублікованого курсу теж недоступні нікому, крім ADMIN.
  if (!course.published) {
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role !== "ADMIN") {
      notFound();
    }
  }

  const [lesson, lessons, quizQuestions, comments, article, myHomework, homeworkAssignment] =
    await Promise.all([
      getLessonByIdService(lessonId).catch(() => null),
      listLessonsService(course.id).catch(() => []),
      getQuizQuestionsForLessonService(lessonId).catch(() => null),
      getCommentsByLessonIdService(lessonId).catch(() => []),
      getArticleByLessonIdService(lessonId).catch(() => null),
      userId
        ? getHomeworkForLessonService(lessonId, userId).catch(() => null)
        : Promise.resolve(null),
      getHomeworkAssignmentByLessonIdService(lessonId).catch(() => null),
    ]);

  if (!lesson || lesson.courseId !== course.id) {
    notFound();
  }

  // Навігація "наступний/попередній урок" (задача 3.16) — за позицією в
  // уже відсортованому за `order` списку (`listLessonsService`).
  const currentIndex = lessons.findIndex((item) => item.id === lesson.id);
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < lessons.length - 1
      ? lessons[currentIndex + 1]
      : null;

  const youtubeId =
    lesson.videoProvider === "YOUTUBE" ? (extractYoutubeId(lesson.videoUrl) ?? "") : "";

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 lg:grid-cols-[320px_1fr]">
          <CourseLessonSidebar
            courseId={course.id}
            courseSlug={course.slug}
            lessons={lessons}
            activeLessonId={lesson.id}
            className="order-2 h-fit lg:order-1 lg:sticky lg:top-24"
          />

          <div className="order-1 lg:order-2">
            <Link
              href={`/courses/${course.slug}`}
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent-dark"
            >
              <ArrowLeftIcon size={16} />
              {course.title}
            </Link>

            <h1 className="mt-3 font-serif text-2xl text-ink sm:text-3xl">
              {lesson.title}
            </h1>

            <div className="mt-6">
              <VideoPlayer
                provider={lesson.videoProvider === "CUSTOM" ? "CUSTOM" : "YOUTUBE"}
                videoId={youtubeId}
                title={lesson.title}
              />
            </div>

            {/* Fixes/F.10 (points fix): кнопка ручного позначення "пройдено" —
                лише для уроків БЕЗ квізу. Якщо в уроку є квіз, єдиний спосіб
                завершити урок — пройти квіз (RealQuizBlock нижче); кнопка тут
                не рендериться, щоб не можна було обійти квіз і при цьому не
                зламати уроки, в яких квізу ще немає (адмінка їх поки не
                покриває повністю). */}
            {!quizQuestions && (
              <div className="mt-5">
                <LessonCompleteButton courseId={course.id} lessonId={lesson.id} />
              </div>
            )}

            <div className="mt-5">
              <GuestProgressBanner />
            </div>

            <RealHomeworkBlock
              lessonId={lesson.id}
              initialVideoUrl={myHomework?.videoUrl ?? null}
              assignment={homeworkAssignment}
              className="mt-6"
            />

            <Card padding="lg" className="mt-6">
              <span className="flex items-center gap-3">
                <h2 className="font-serif text-xl text-ink">Про сьогоднішній урок</h2>
                <Badge variant="soft" icon={<DocumentIcon size={13} />}>
                  Стаття про урок
                </Badge>
              </span>

              <div className="mt-4">
                {article && article.contentJson.trim() ? (
                  <ArticleRenderer contentJson={article.contentJson} />
                ) : (
                  <p className="rounded-xl border border-dashed border-rose-line/60 bg-cream-soft/40 px-4 py-6 text-center text-sm text-muted">
                    До цього уроку ще не додано статтю. Зазирни трохи пізніше — матеріал
                    з&apos;явиться тут.
                  </p>
                )}
              </div>
            </Card>

            {quizQuestions && (
              <div className="mt-6">
                <RealQuizBlock
                  courseId={course.id}
                  lessonId={lesson.id}
                  questions={quizQuestions}
                />
              </div>
            )}

            <RealCommentsBlock
              lessonId={lesson.id}
              initialComments={comments}
              className="mt-6"
            />

            <div className="mt-8 flex items-center justify-between gap-4 border-t border-rose-line/40 pt-6">
              {previousLesson ? (
                <Link
                  href={`/courses/${course.slug}/lessons/${previousLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-accent-dark"
                >
                  <ArrowLeftIcon size={16} />
                  <span className="hidden sm:inline">{previousLesson.title}</span>
                  <span className="sm:hidden">Попередній урок</span>
                </Link>
              ) : (
                <span />
              )}

              {nextLesson ? (
                <Link
                  href={`/courses/${course.slug}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-accent-dark hover:text-accent"
                >
                  <span className="hidden sm:inline">{nextLesson.title}</span>
                  <span className="sm:hidden">Наступний урок</span>
                  <ArrowRightIcon size={16} />
                </Link>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
