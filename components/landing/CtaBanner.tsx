"use client";

import { useRouter } from "next/navigation";
import { GiftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { LESSONS } from "@/lib/data/lessons";
import type { Course as RealCourse } from "@/modules/courses";
import type { Lesson as RealLesson } from "@/modules/lessons";

export interface CtaBannerProps {
  /**
   * Featured-курс, вибраний адміном (`modules/siteSettings`, ФАЗА
   * HOME+) — той самий проп, що вже передається в `HeroSection`/
   * `ProgramSection` з `app/page.tsx`.
   */
  featuredCourse?: RealCourse | null;
  /** Уроки кожного реального курсу (за `courseId`), той самий проп, що вже в `HeroSection`/`ProgramSection`. */
  realLessonsByCourseId?: Record<string, RealLesson[]>;
}

/**
 * 02.08.2026, Фаза "Fixes", задача F.8, за прямим зверненням користувача
 * ("посилання 'почати навчання' веде на сторінку з несправжніми
 * коментарями/статтею/квізом"): кнопка й лічильник уроків раніше ЗАВЖДИ
 * були захардкоджені на `LESSONS` (`lib/data/lessons.ts`, легасі демо-курс)
 * — той самий баг, що на `HeroSection` (виправлено там же, той самий фікс,
 * той самий принцип). Тепер: якщо є `featuredCourse` (ФАЗА HOME+, замінив
 * колишній клієнтський `useFeaturedCourse` + пошук за `slug`) і в нього
 * є хоча б один реальний урок — і кнопка, і лічильник "Доступ до всіх N
 * уроків" беруть РЕАЛЬНІ дані; інакше — той самий фолбек на легасі
 * демо-курс, що й раніше (щоб банер не зламався, коли featured-курсу з
 * уроками ще немає взагалі).
 */
export function CtaBanner({
  featuredCourse = null,
  realLessonsByCourseId = {},
}: CtaBannerProps) {
  const router = useRouter();

  const realLessons = featuredCourse
    ? (realLessonsByCourseId[featuredCourse.id] ?? [])
    : [];
  const firstLesson = realLessons[0];
  const lessonsCount = featuredCourse ? realLessons.length : LESSONS.length;

  function handleClick() {
    if (featuredCourse && firstLesson) {
      router.push(`/courses/${featuredCourse.slug}/lessons/${firstLesson.id}`);
    } else {
      router.push(`/lessons/${LESSONS[0].slug}`);
    }
  }

  return (
    <section className="relative py-10 sm:py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center gap-6 rounded-3xl bg-accent-dark px-8 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
              <GiftIcon size={26} />
            </span>
            <div>
              <h2 className="font-serif text-2xl text-white sm:text-3xl">
                Курс безкоштовний — і завжди буде
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Доступ до всіх {lessonsCount} уроків просто зараз — без реєстрації.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Почати навчання
            <ArrowRightIcon size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
