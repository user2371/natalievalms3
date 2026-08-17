"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { GuestGate } from "@/components/account/GuestGate";
import { HomeworkVideoCard } from "@/components/profile/HomeworkVideoCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  DocumentIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UploadIcon,
  PlayIcon,
  CheckIcon,
} from "@/components/ui/icons";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getPublicProfileAction } from "@/modules/profile/actions";
import type { PublicProfile } from "@/modules/profile/service";

/** Заглушка обкладинки курсу (той самий підхід, що на `/profile`/`/users/[id]`), коли `Course.coverImage` не задано в адмінці. */
const FALLBACK_COURSE_COVER = "/heroImage.png";

/**
 * Сторінка "Домашні завдання" (`/homework`, задачі 0.9b.1–0.9b.4) — за
 * макетом `HomeWorkPage.png`.
 *
 * 02.08.2026, Фаза "Fixes", за прямим зверненням користувача ("бачу тут
 * 'ще немає домашніх завдань', хоча вже здав ДЗ — наче чужу сторінку"):
 * сторінка читала ЛИШЕ легасі `localStorage` (`useLocalHomework`/
 * `useLocalProgress`, дані статичного демо-курсу `/lessons/[slug]`), тоді
 * як реальна здача ДЗ на справжніх уроках (`/courses/[slug]/lessons/
 * [lessonId]`, `RealHomeworkBlock`, задача 9.15) пише в Prisma
 * (`modules/homework`) — два повністю непов'язані джерела даних (той самий
 * баг, що вже виправлявся на `/profile`/`/users/[id]`, F.1/F.2). Тепер —
 * той самий реальний сервіс, що вже живить `/profile`:
 * `getPublicProfileAction(session.user.id)` →
 * `profile.completedCourses`/`profile.homeworkVideos`. На відміну від
 * `/profile` (де лише 5 останніх сертифікатів/ДЗ), тут — ПОВНИЙ список з
 * пошуком, як і було задумано design'ом сторінки, просто тепер на
 * реальних даних. Через кілька РЕАЛЬНИХ курсів (а не один захардкоджений
 * `COURSES[0]`) — акордеон тепер по одному на кожен курс із
 * `completedCourses`, а не єдина секція.
 */
export default function HomeworkPage() {
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const userId = session?.user?.id;

  const [query, setQuery] = useState("");
  const [openCourses, setOpenCourses] = useState<Record<number, boolean>>({});
  const [showAllByCourse, setShowAllByCourse] = useState<Record<number, boolean>>({});
  const [profile, setProfile] = useState<PublicProfile | null>(null);

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

  const completedCourses = useMemo(() => profile?.completedCourses ?? [], [profile]);
  const homeworkVideos = useMemo(() => profile?.homeworkVideos ?? [], [profile]);
  const hasAnyContent = completedCourses.length > 0 || homeworkVideos.length > 0;

  const filteredVideos = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return homeworkVideos;
    return homeworkVideos.filter((item) =>
      item.lessonTitle.toLowerCase().includes(trimmed),
    );
  }, [homeworkVideos, query]);

  // Відео поза списком реально пройдених курсів (напр. курс щойно
  // розпочато, ще жоден урок не позначено пройденим, але ДЗ вже здано) —
  // показуємо окремою секцією внизу, щоб жодне здане відео не губилось.
  const videosByCourseName = useMemo(() => {
    const map = new Map<string, typeof filteredVideos>();
    for (const video of filteredVideos) {
      const list = map.get(video.courseName) ?? [];
      list.push(video);
      map.set(video.courseName, list);
    }
    return map;
  }, [filteredVideos]);

  const knownCourseNames = new Set(completedCourses.map((c) => c.title));
  const otherVideos = filteredVideos.filter(
    (video) => !knownCourseNames.has(video.courseName),
  );

  const displayName = session?.user?.name ?? profile?.name ?? "";
  const avatarUrl =
    (session?.user as { avatarUrl?: string } | undefined)?.avatarUrl ??
    profile?.avatarUrl ??
    null;

  if (status === "loading") {
    return null;
  }

  if (!loggedIn) {
    return <GuestGate description="сторінки «Домашні завдання»" />;
  }

  return (
    <AccountLayout user={{ name: displayName, avatarUrl }}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
            <DocumentIcon size={22} />
          </span>
          <div>
            <h1 className="font-serif text-3xl text-ink sm:text-4xl">Домашні завдання</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Переглядай свої здані роботи та відстежуй прогрес. Кожне відео — це реальний
              досвід і прогрес.
            </p>
          </div>
        </div>

        <div className="w-full shrink-0 rounded-2xl border border-rose-line/40 bg-accent-soft/30 p-5 lg:w-80">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-accent">
              <PlayIcon size={16} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">
                Надсилай свої домашні завдання
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Виконуй уроки та здавай відео, щоб з часом бачити свій прогрес, і
                розвивати своє портфоліо.
              </p>
              <Link href="/courses" className="mt-3 inline-block">
                <Button variant="outline" size="sm">
                  Дізнатись більше
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {!hasAnyContent ? (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-dashed border-rose-line/60 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
            <DocumentIcon size={24} />
          </span>
          <div>
            <p className="font-serif text-xl text-ink">Ви ще не почали жоден курс</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Почни проходити уроки, щоб бачити тут свій прогрес і здавати домашні
              завдання.
            </p>
          </div>
          <Link href="/courses">
            <Button size="sm">Переглянути курси</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:max-w-sm">
              <Input
                icon={<SearchIcon size={18} />}
                placeholder="Пошук за назвою уроку..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Пошук за назвою уроку"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5">
            {completedCourses.map((course, index) => {
              const courseOpen = openCourses[index] ?? true;
              const courseVideos = videosByCourseName.get(course.title) ?? [];
              const showAll = showAllByCourse[index] ?? false;
              const visibleVideos = showAll ? courseVideos : courseVideos.slice(0, 5);
              const progressPercent = Math.round(
                (course.completedLessons / Math.max(course.totalLessons, 1)) * 100,
              );
              const courseCompleted = course.completedLessons === course.totalLessons;

              return (
                <div
                  key={`${course.title}-${index}`}
                  className="overflow-hidden rounded-2xl border border-rose-line/40"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenCourses((prev) => ({ ...prev, [index]: !courseOpen }))
                    }
                    aria-expanded={courseOpen}
                    className="flex w-full items-center gap-4 p-5 text-left"
                  >
                    <span className="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-soft">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={course.coverImage ?? FALLBACK_COURSE_COVER}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-serif text-lg text-ink">
                          {course.title}
                        </span>
                        <Badge variant="soft" className="normal-case">
                          {course.totalLessons} уроків
                        </Badge>
                        {courseCompleted && (
                          <Badge
                            variant="solid"
                            icon={<CheckIcon size={12} />}
                            className="normal-case"
                          >
                            Курс завершено
                          </Badge>
                        )}
                      </span>
                      <span className="mt-2 flex items-center gap-3">
                        <ProgressBar
                          value={progressPercent}
                          size="sm"
                          className="max-w-xs"
                        />
                        <span className="shrink-0 text-xs text-muted">
                          {course.completedLessons} з {course.totalLessons} уроків
                          пройдено
                        </span>
                      </span>
                    </span>
                    <span className="text-muted">
                      {courseOpen ? (
                        <ChevronUpIcon size={18} />
                      ) : (
                        <ChevronDownIcon size={18} />
                      )}
                    </span>
                  </button>

                  {courseOpen && (
                    <div className="border-t border-rose-line/40 p-5">
                      <p className="mb-3 text-sm font-medium text-ink">Здані відео ДЗ</p>

                      {courseVideos.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-rose-line/60 py-10 text-center text-sm text-muted">
                          {query
                            ? "Нічого не знайдено за цим запитом."
                            : "Ще немає зданих відео ДЗ по цьому курсу. Здай перше домашнє завдання на сторінці будь-якого уроку — і воно одразу зʼявиться тут."}
                        </p>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                            {visibleVideos.map((item, videoIndex) => (
                              <HomeworkVideoCard
                                key={`${course.title}-${videoIndex}`}
                                courseName={item.courseName}
                                lessonNumber={item.lessonNumber}
                                lessonTitle={item.lessonTitle}
                                submittedAt={item.submittedAt}
                                videoId={item.videoId}
                              />
                            ))}
                          </div>
                          {courseVideos.length > visibleVideos.length && (
                            <div className="mt-6 flex justify-center">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<ChevronDownIcon size={16} />}
                                onClick={() =>
                                  setShowAllByCourse((prev) => ({
                                    ...prev,
                                    [index]: true,
                                  }))
                                }
                              >
                                Показати всі {courseVideos.length} відео
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {otherVideos.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-rose-line/40 p-5">
                <p className="mb-3 text-sm font-medium text-ink">Інші здані відео ДЗ</p>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
                  {otherVideos.map((item, videoIndex) => (
                    <HomeworkVideoCard
                      key={`other-${videoIndex}`}
                      courseName={item.courseName}
                      lessonNumber={item.lessonNumber}
                      lessonTitle={item.lessonTitle}
                      submittedAt={item.submittedAt}
                      videoId={item.videoId}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl bg-ink p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-accent-soft">
            <UploadIcon size={18} />
          </span>
          <div>
            <p className="text-sm font-medium text-white">
              Готова поділитися своїм результатом?
            </p>
            <p className="mt-0.5 text-xs text-white/60">
              Завантаж відео домашнього завдання на сторінці уроку й отримай зворотний
              звʼязок від майстра.
            </p>
          </div>
        </div>
        <Link href="/courses">
          <Button size="sm">Перейти до уроків</Button>
        </Link>
      </div>
    </AccountLayout>
  );
}
