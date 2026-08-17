"use client";

import { Avatar } from "@/components/ui/Avatar";
import { StarIcon, UsersIcon, CheckIcon } from "@/components/ui/icons";
import { useFeaturedCourse } from "@/lib/progress/useFeaturedCourse";
import type { Course as RealCourse } from "@/modules/courses";

const STATS = [
  { icon: StarIcon, value: "5+ років", label: "досвіду в індустрії" },
  { icon: UsersIcon, value: "1000+", label: "навчених учениць" },
  { icon: CheckIcon, value: "100%", label: "практики в кожному уроці" },
];

const FALLBACK_NAME = "Наталія";
const FALLBACK_BIO =
  "Наталія — майстер манікюру, яка створила цей курс, щоб зробити якісну освіту в " +
  "індустрії краси доступною для кожної. Поєднує глибоку теоретичну базу з акцентом " +
  "на практичні навички, які знадобляться з перших робіт.";

export interface MasterSectionProps {
  /**
   * Реальні (Prisma) курси з БД — передаються з `app/page.tsx` (Server
   * Component, `listCoursesService(true)`, той самий проп, що й у
   * `HeroSection`). Секція "містить" вибраний адміном статичний курс
   * (`useFeaturedCourse`, задача 0.20) з реальним DB-курсом за `slug`
   * (задача 3.11, доповнення 24.07.2026 — нові поля `masterName`/
   * `masterBio`/`masterAvatarUrl` у `Course`, міграція
   * `20260725060000_course_master_fields`). Якщо збігу немає, або поля
   * майстра порожні — секція лишається на статичному фолбеку, як і була.
   */
  realCourses?: RealCourse[];
}

export function MasterSection({ realCourses = [] }: MasterSectionProps) {
  const { featuredCourse } = useFeaturedCourse();
  const realCourse = realCourses.find((course) => course.slug === featuredCourse.slug);

  const name = realCourse?.masterName || FALLBACK_NAME;
  const bio = realCourse?.masterBio || FALLBACK_BIO;
  const avatarUrl = realCourse?.masterAvatarUrl ?? null;

  return (
    <section id="master" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <Avatar src={avatarUrl} name={name} size={96} className="mx-auto text-2xl" />

        <h2 className="mt-6 font-serif text-3xl text-ink sm:text-4xl">Про майстра</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted">{bio}</p>
        <p className="mt-3 font-serif text-lg text-accent-dark">— {name}, автор курсу</p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-rose-line/40 bg-white p-6"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
                <Icon size={20} />
              </span>
              <span className="font-serif text-2xl text-ink">{value}</span>
              <span className="text-xs text-muted">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
