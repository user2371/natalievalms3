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
import { useFeaturedCourse } from "@/lib/progress/useFeaturedCourse";
import type { Course as RealCourse } from "@/modules/courses";
import type { Lesson as RealLesson } from "@/modules/lessons";

const STATIC_FEATURES = [
  { icon: DiplomaIcon, label: "Сертифікат по завершенню" },
  { icon: ClockIcon, label: "Доступ назавжди" },
  { icon: GraduationCapIcon, label: "Навчання у своєму темпі" },
];

export interface HeroSectionProps {
  /**
   * Реальні (Prisma) курси з БД — передаються з `app/page.tsx` (Server
   * Component, `listCoursesService(true)` з `modules/courses`, задача 3.11).
   * Курс, вибраний адміном через `useFeaturedCourse` (задача 0.20, статичний
   * каталог `lib/data/courses.ts`), і реальний DB-курс — досі два окремі
   * набори даних (задокументована проблема, 0.20.1). Тут вони "місткуються"
   * лише за `slug`: якщо серед `realCourses` є курс з тим самим `slug`, що
   * й вибраний `featuredCourse`, — опис у Hero береться з РЕАЛЬНИХ даних
   * (`realCourse.description`), інакше лишається статичний опис як і
   * раніше. Пуста/відсутня БД (сандбокс без мережі до Prisma) не ламає
   * секцію — `realCourses` за замовчуванням `[]`, і Hero просто працює на
   * статичних даних, як і до цієї задачі.
   */
  realCourses?: RealCourse[];
  /** Уроки кожного реального курсу (за `courseId`), той самий проп, що вже передається в `ProgramSection` з `app/page.tsx` (задача 3.11) — тут для CTA "Почати навчання" (задача F.8). */
  realLessonsByCourseId?: Record<string, RealLesson[]>;
}

/**
 * Hero-секція лендінгу — за мокапом (0.5.1). Заголовок і CTA-кнопка
 * лишаються генеричними ("Опануй мистецтво манікюру з нуля" — фраза бренду,
 * не назва конкретного курсу), а опис і лічильник уроків тепер підтягуються
 * з курсу, вибраного адміном на `/admin/courses` (задача 0.20,
 * `useFeaturedCourse`), з накладеними поверх реальними DB-даними, якщо є
 * відповідний курс (задача 3.11, див. `HeroSectionProps.realCourses`). Якщо
 * вибраний курс — не той єдиний, що вже має реальні уроки
 * (`featuredCourse.available === false`, макетна картка "Незабаром"),
 * кнопка веде в каталог `/courses` замість неіснуючих уроків, і текст
 * кнопки міняється на "Переглянути курс".
 *
 * 02.08.2026, Фаза "Fixes", задача F.8, за прямим зверненням користувача
 * ("посилання 'почати навчання' веде на сторінку з несправжніми
 * коментарями/статтею/квізом"): кнопка раніше ЗАВЖДИ вела на
 * `/lessons/${LESSONS[0].slug}` — легасі статичний демо-урок (мокові
 * коментарі/стаття/квіз, `lib/data/lessons.ts`), навіть коли на сайті вже
 * є реальний, опублікований курс (`realCourse` знайдений). Виправлено:
 * якщо є `realCourse` і в нього є хоча б один урок
 * (`realLessonsByCourseId`, той самий проп, що вже передається в
 * `ProgramSection` з `app/page.tsx` — сервер уже й так завантажує ці дані,
 * тож зайвого запиту тут не знадобилось) — кнопка веде на
 * `/courses/${realCourse.slug}/lessons/${lesson.id}` (справжня сторінка,
 * реальні дані з `modules/comments`/`modules/articles`/`modules/quizzes`);
 * легасі `/lessons/${LESSONS[0].slug}` лишається ЛИШЕ як крайній фолбек,
 * коли реального курсу з уроками ще немає взагалі (порожня БД чи курс без
 * жодного уроку) — щоб кнопка не вела в нікуди.
 */
export function HeroSection({
  realCourses = [],
  realLessonsByCourseId = {},
}: HeroSectionProps) {
  const router = useRouter();
  const { featuredCourse } = useFeaturedCourse();

  const realCourse = realCourses.find((course) => course.slug === featuredCourse.slug);
  const firstLesson = realCourse ? realLessonsByCourseId[realCourse.id]?.[0] : undefined;
  const description = realCourse?.description ?? featuredCourse.description;

  const features = [
    { icon: PlayIcon, label: `${featuredCourse.lessonsCount} відеоуроків` },
    ...STATIC_FEATURES,
  ];

  function handleCtaClick() {
    if (realCourse && firstLesson) {
      router.push(`/courses/${realCourse.slug}/lessons/${firstLesson.id}`);
    } else if (featuredCourse.available) {
      // Фолбек — реального курсу з уроками ще немає взагалі (крайній
      // випадок, не мала статись за звичайних умов, коли featuredCourse
      // "available"). Легасі демо-урок — краще, ніж кнопка в нікуди.
      router.push(`/lessons/${LESSONS[0].slug}`);
    } else {
      router.push("/courses");
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
              {featuredCourse.available
                ? "Почати навчання безкоштовно"
                : "Переглянути курс"}
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
