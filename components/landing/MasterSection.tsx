import { Avatar } from "@/components/ui/Avatar";
import { StarIcon, UsersIcon, CheckIcon } from "@/components/ui/icons";
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
   * Featured-курс, вибраний адміном (`modules/siteSettings`, ФАЗА
   * HOME+) — вантажиться на сервері в `app/page.tsx` і передається
   * сюди готовим (задача 3.11, доповнення 24.07.2026 — поля
   * `masterName`/`masterBio`/`masterAvatarUrl` у `Course`, міграція
   * `20260725060000_course_master_fields`). `null`, або порожні поля
   * майстра — секція лишається на статичному фолбеку.
   *
   * ДО ФАЗИ HOME+ секція сама шукала курс за `slug` через клієнтський
   * `useFeaturedCourse` — тепер це робить `app/page.tsx`, тут лише
   * готовий проп.
   */
  featuredCourse?: RealCourse | null;
}

export function MasterSection({ featuredCourse = null }: MasterSectionProps) {
  const name = featuredCourse?.masterName || FALLBACK_NAME;
  const bio = featuredCourse?.masterBio || FALLBACK_BIO;
  const avatarUrl = featuredCourse?.masterAvatarUrl ?? null;

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
