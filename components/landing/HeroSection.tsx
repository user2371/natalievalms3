"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ArrowRightIcon,
  DiplomaIcon,
  ClockIcon,
  PlayIcon,
  GraduationCapIcon,
  SparkleIcon,
} from "@/components/ui/icons";
import { LESSONS } from "@/lib/data/lessons";
import type { Course as RealCourse } from "@/modules/courses";
import type { Lesson as RealLesson } from "@/modules/lessons";

const STATIC_FEATURES = [
  { icon: DiplomaIcon, label: "Сертифікат по завершенню" },
  { icon: ClockIcon, label: "Доступ назавжди" },
  { icon: GraduationCapIcon, label: "Навчання у своєму темпі" },
];

const FALLBACK_DESCRIPTION =
  "Покроковий безкоштовний курс для новачків: від будови нігтя та " +
  "інструментів до впевненого покриття гель-лаком і легкого дизайну. " +
  "Навчайся у своєму темпі, без реєстрації.";
const FALLBACK_LESSONS_COUNT = 14;

export interface HeroSectionProps {
  /**
   * Featured-курс, вибраний адміном на `/admin/courses`
   * (`modules/siteSettings`, ФАЗА HOME+) — вантажиться на сервері в
   * `app/page.tsx` і передається сюди готовим. `null`, якщо ще не
   * обрано / курс знято з публікації / видалено — тоді секція лишається
   * на статичному фолбек-контенті нижче (`FALLBACK_DESCRIPTION`/
   * `FALLBACK_LESSONS_COUNT`), той самий принцип "БД недоступна не
   * ламає лендінг", що вже прийнятий у проєкті.
   *
   * ДО ФАЗИ HOME+ тут була складніша схема з двома незалежними
   * джерелами курсів (статичний `useFeaturedCourse`-вибір + пошук
   * відповідного реального курсу за `slug`, задокументована проблема
   * 0.20.1) — тепер лише ОДИН реальний курс, без "містячих" хаків.
   */
  featuredCourse?: RealCourse | null;
  /** Уроки кожного реального курсу (за `courseId`), той самий проп, що вже передається в `ProgramSection` з `app/page.tsx` (задача 3.11) — тут для CTA "Почати навчання" (задача F.8). */
  realLessonsByCourseId?: Record<string, RealLesson[]>;
}

/**
 * Hero-секція лендінгу — за мокапом (0.5.1). Заголовок і CTA-кнопка
 * лишаються генеричними ("Опануй мистецтво манікюру з нуля" — фраза бренду,
 * не назва конкретного курсу), а опис і лічильник уроків тепер підтягуються
 * з featured-курсу, вибраного адміном (ФАЗА HOME+, `modules/siteSettings`).
 * Якщо курс не обрано, або в нього немає жодного реального уроку — кнопка
 * веде в каталог `/courses` замість неіснуючих уроків, і текст кнопки
 * міняється на "Переглянути курс".
 *
 * 02.08.2026, Фаза "Fixes", задача F.8, за прямим зверненням користувача
 * ("посилання 'почати навчання' веде на сторінку з несправжніми
 * коментарями/статтею/квізом"): кнопка раніше ЗАВЖДИ вела на
 * `/lessons/${LESSONS[0].slug}` — легасі статичний демо-урок (мокові
 * коментарі/стаття/квіз, `lib/data/lessons.ts`), навіть коли на сайті вже
 * є реальний, опублікований курс. Виправлено: якщо є `featuredCourse` і в
 * нього є хоча б один урок (`realLessonsByCourseId`) — кнопка веде на
 * `/courses/${featuredCourse.slug}/lessons/${lesson.id}` (справжня
 * сторінка, реальні дані з `modules/comments`/`modules/articles`/
 * `modules/quizzes`); легасі `/lessons/${LESSONS[0].slug}` лишається ЛИШЕ
 * як крайній фолбек, коли featured-курсу з уроками ще немає взагалі
 * (порожня БД чи курс без жодного уроку) — щоб кнопка не вела в нікуди.
 *
 * ФАЗА HOME+ (29.08.2026), заодно виправлено ще один баг, знайдений
 * аудитом: лічильник "N відеоуроків" РАНІШЕ брався зі статичного поля
 * старого типу курсу (завжди те саме число, незалежно від реального
 * вибору) — тепер це `realLessonsByCourseId[featuredCourse.id]?.length`,
 * реальна кількість уроків featured-курсу.
 */
export function HeroSection({
  featuredCourse = null,
  realLessonsByCourseId = {},
}: HeroSectionProps) {
  const router = useRouter();

  const firstLesson = featuredCourse
    ? realLessonsByCourseId[featuredCourse.id]?.[0]
    : undefined;
  const description = featuredCourse?.description ?? FALLBACK_DESCRIPTION;
  const lessonsCount = featuredCourse
    ? (realLessonsByCourseId[featuredCourse.id]?.length ?? FALLBACK_LESSONS_COUNT)
    : FALLBACK_LESSONS_COUNT;

  const features = [
    { icon: PlayIcon, label: `${lessonsCount} відеоуроків` },
    ...STATIC_FEATURES,
  ];

  function handleCtaClick() {
    if (featuredCourse && firstLesson) {
      router.push(`/courses/${featuredCourse.slug}/lessons/${firstLesson.id}`);
    } else if (!featuredCourse) {
      // Немає featured-курсу взагалі — веде в каталог, де можна обрати
      // будь-який опублікований курс, замість неіснуючих уроків.
      router.push("/courses");
    } else {
      // Фолбек — featured-курс обрано, але в нього ще немає жодного
      // реального уроку (крайній випадок). Легасі демо-урок — краще, ніж
      // кнопка в нікуди.
      router.push(`/lessons/${LESSONS[0].slug}`);
    }
  }

  return (
    <section id="about" className="relative isolate overflow-hidden pt-14 pb-20 sm:pt-20">
      <Image
        src="/images/hero-about.png"
        alt="Доглянутий манікюр з покриттям гель-лаком — курс Natalieva"
        fill
        sizes="100vw"
        priority
        className="-z-20 object-cover"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cream via-cream/85 to-transparent sm:via-cream/70" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-lg">
          <Badge icon={<SparkleIcon size={14} />}>Безкоштовний онлайн курс</Badge>

          <h1 className="mt-5 font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Опануй мистецтво манікюру з нуля
          </h1>

          <p className="mt-5 max-w-lg text-base text-muted sm:text-lg">{description}</p>

          <ul className="mt-8 grid grid-cols-2 gap-4 sm:max-w-md">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm text-ink/80">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
                  <Icon size={17} />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              icon={<ArrowRightIcon size={18} />}
              onClick={handleCtaClick}
            >
              Почати навчання безкоштовно
            </Button>
            <span className="text-sm text-muted">
              Без реєстрації — прогрес збережеться локально
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
