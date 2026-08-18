"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { GuestGate } from "@/components/account/GuestGate";
import { HomeworkVideoCard } from "@/components/profile/HomeworkVideoCard";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  GraduationCapIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { getPublicProfileAction } from "@/modules/profile/actions";
import { getLessonsWithCompletionAction } from "@/modules/lessons";
import type { PublicProfile, PublicHomeworkVideo } from "@/modules/profile/service";
import type { LessonWithCompletion } from "@/modules/lessons";
export const dynamic = 'force-dynamic'
/** Заглушка обкладинки курсу (той самий підхід, що на `/profile`/`/homework`), коли `Course.coverImage` не задано в адмінці. */
const FALLBACK_COURSE_COVER = "/heroImage.png";

/**
 * Сторінка "Моє навчання" (`/my-learning`, задача 0.15), за мокапом
 * `mockup-02-my-learning.html`.
 *
 * 02.08.2026, Фаза "Fixes", задача F.6, за прямим зверненням користувача
 * ("бачу тут ніби чужу сторінку, хоч уже проходжу курс") — той самий клас
 * багів, що F.1/F.2/F.5: сторінка читала ЛИШЕ легасі `localStorage`
 * (`useLocalProgress`/`useLocalHomework`, дані статичного демо-курсу
 * `/lessons/[slug]`) і `DEMO_PROFILE` для імені, повністю не пов'язані з
 * реальним прогресом на справжніх курсах (`/courses/[slug]/lessons/
 * [lessonId]`). Тепер — реальні дані:
 * - `getPublicProfileAction` (той самий сервіс, що вже на `/profile`/
 *   `/homework`) → `completedCourses` (реальні курси з хоча б одним
 *   пройденим уроком) і `homeworkVideos`;
 * - НОВИЙ `getLessonsWithCompletionAction` (`modules/lessons`, задача F.6)
 *   → чекліст уроків курсу з реальним статусом проходження (раніше —
 *   статичний `LESSONS`/`useLocalProgress`) — підвантажується ЛІНИВО, лише
 *   коли акордеон курсу розгорнутий (`openCourseId`), щоб не робити зайвих
 *   запитів на кожен курс одразу при завантаженні сторінки.
 *
 * Через можливість кількох РЕАЛЬНИХ курсів — акордеон тепер по одному на
 * кожен курс (замість єдиної секції на `COURSES[0]`), клікабельні пройдені
 * уроки ведуть на реальний `/courses/[slug]/lessons/[lessonId]` (замість
 * легасі `/lessons/[slug]`).
 */
export default function MyLearningPage() {
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const userId = session?.user?.id;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [openCourseId, setOpenCourseId] = useState<string | null>(null);
  const [lessonsByCourse, setLessonsByCourse] = useState<
    Record<string, LessonWithCompletion[]>
  >({});
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getPublicProfileAction(userId).then((result) => {
      if (!cancelled && result.success) setProfile(result.profile);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function toggleCourse(courseId: string) {
    if (openCourseId === courseId) {
      setOpenCourseId(null);
      return;
    }
    setOpenCourseId(courseId);
    if (!lessonsByCourse[courseId]) {
      setLoadingCourseId(courseId);
      const result = await getLessonsWithCompletionAction(courseId);
      if (result.success) {
        setLessonsByCourse((prev) => ({ ...prev, [courseId]: result.lessons }));
      }
      setLoadingCourseId(null);
    }
  }

  const completedCourses = profile?.completedCourses ?? [];
  const homeworkVideos = profile?.homeworkVideos ?? [];
  const hasStarted = completedCourses.length > 0;

  if (status === "loading") {
    return null;
  }

  if (!loggedIn) {
    return <GuestGate description="сторінки «Моє навчання»" />;
  }

  return (
    <AccountLayout
      user={{
        name: session?.user?.name ?? profile?.name ?? "",
        avatarUrl:
          (session?.user as { avatarUrl?: string } | undefined)?.avatarUrl ??
          profile?.avatarUrl ??
          null,
      }}
    >
      <div className="flex gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
          <GraduationCapIcon size={22} />
        </span>
        <div>
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">Моє навчання</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Продовжуй з того місця, де зупинилась — прогрес зберігається автоматично.
          </p>
        </div>
      </div>

      {!hasStarted ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-rose-line/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
            <GraduationCapIcon size={24} />
          </span>
          <div>
            <p className="font-serif text-xl text-ink">Ви ще не почали жоден курс</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Почни проходити уроки, щоб бачити тут свій прогрес і продовжувати з того
              місця, де зупинилась.
            </p>
          </div>
          <Link href="/courses">
            <Button size="sm">Переглянути курси</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          {completedCourses.map((course) => {
            const lessonsOpen = openCourseId === course.id;
            const progressPercent = Math.round(
              (course.completedLessons / Math.max(course.totalLessons, 1)) * 100,
            );
            const isCompleted = course.completedLessons === course.totalLessons;
            const lessons = lessonsByCourse[course.id];
            const courseVideos = homeworkVideos.filter(
              (video: PublicHomeworkVideo) => video.courseName === course.title,
            );

            return (
              <div
                key={course.id}
                className="rounded-[22px] border border-rose-line/50 bg-white p-6"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <span className="h-[72px] w-24 shrink-0 overflow-hidden rounded-xl bg-cream-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={course.coverImage ?? FALLBACK_COURSE_COVER}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </span>

                  <div className="min-w-[160px] flex-1">
                    <h3 className="font-serif text-lg text-ink">{course.title}</h3>
                    {isCompleted ? (
                      <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-[11px] font-bold tracking-wide text-success uppercase">
                        <CheckIcon size={12} />
                        Курс завершено
                      </span>
                    ) : (
                      <p className="mt-0.5 text-[12.5px] text-muted">
                        {course.completedLessons} з {course.totalLessons} уроків пройдено
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-[180px] items-center gap-2.5">
                    <ProgressBar
                      value={progressPercent}
                      size="sm"
                      className="w-32 sm:w-44"
                    />
                    <span className="min-w-[34px] text-right text-sm font-bold text-accent-dark">
                      {progressPercent}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCourse(course.id)}
                    aria-expanded={lessonsOpen}
                    className="ml-auto flex items-center gap-1 text-[12.5px] font-semibold text-accent-dark"
                  >
                    Уроки
                    {lessonsOpen ? (
                      <ChevronUpIcon size={14} />
                    ) : (
                      <ChevronDownIcon size={14} />
                    )}
                  </button>
                </div>

                {lessonsOpen && (
                  <>
                    <div className="mt-4 border-t border-cream-soft pt-4">
                      {loadingCourseId === course.id || !lessons ? (
                        <p className="py-4 text-center text-sm text-muted">
                          Завантаження…
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                          {lessons.map((lesson) => {
                            const rowClassName = cn(
                              "flex items-center gap-2.5 rounded-md py-0.5 text-[13.5px]",
                              lesson.completed ? "text-ink" : "text-muted",
                            );
                            const dot = (
                              <span
                                className={cn(
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                  lesson.completed
                                    ? "bg-success text-white"
                                    : "border-[1.5px] border-rose-line",
                                )}
                              >
                                {lesson.completed && <CheckIcon size={11} />}
                              </span>
                            );

                            return lesson.completed ? (
                              <Link
                                key={lesson.id}
                                href={`/courses/${course.slug}/lessons/${lesson.id}`}
                                className={cn(
                                  rowClassName,
                                  "hover:text-accent-dark hover:underline",
                                )}
                              >
                                {dot}
                                {lesson.order}. {lesson.title}
                              </Link>
                            ) : (
                              <div key={lesson.id} className={rowClassName}>
                                {dot}
                                {lesson.order}. {lesson.title}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-cream-soft pt-4">
                      <p className="mb-3 text-sm font-medium text-ink">Здані відео ДЗ</p>

                      {courseVideos.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-rose-line/60 py-8 text-center text-sm text-muted">
                          Ще немає зданих відео ДЗ по цьому курсу. Здай перше домашнє
                          завдання на сторінці уроку — і воно зʼявиться тут.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          {courseVideos.map((item, index) => (
                            <HomeworkVideoCard
                              key={`${course.id}-hw-${index}`}
                              courseName={item.courseName}
                              lessonNumber={item.lessonNumber}
                              lessonTitle={item.lessonTitle}
                              submittedAt={item.submittedAt}
                              videoId={item.videoId}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AccountLayout>
  );
}
