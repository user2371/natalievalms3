import { VideoPlayer } from "@/components/lesson/VideoPlayer";
import { CheckIcon } from "@/components/ui/icons";
import { INTRO_LESSON } from "@/lib/data/lessons";
import { extractYoutubeId } from "@/lib/youtube";
import type { Course as RealCourse } from "@/modules/courses";

const FALLBACK_DESCRIPTION =
  "Перш ніж перейти до практики, познайомся з курсом і майстринею: чого чекати " +
  "від навчання, як побудована програма і що знадобиться для перших уроків. Це " +
  "коротке відео допоможе налаштуватися на результат.";

const FALLBACK_HIGHLIGHTS = [
  "Анатомія нігтя та поширені захворювання",
  "Інструменти, дезінфекція та підготовка",
  "Матеріали для гель-лаку та нарощування",
  "Покриття, зняття та дизайн нігтів крок за кроком",
];

export interface IntroSectionProps {
  /**
   * Featured-курс, вибраний адміном (`modules/siteSettings`, ФАЗА
   * HOME+) — вантажиться на сервері в `app/page.tsx`. `null` — секція
   * лишається на статичному фолбек-контенті нижче (`INTRO_LESSON` +
   * `FALLBACK_DESCRIPTION`/`FALLBACK_HIGHLIGHTS`).
   *
   * ДО ФАЗИ HOME+ ця секція була на 100% статичною й НЕ читала жодних
   * даних курсу взагалі — коментар, що був у цьому файлі, вже
   * документував намір: "Текст нижче відповідає майбутнім редагованим
   * полям курсу (Course.introTitle / Course.introDescription /
   * Course.introHighlights — Фаза 8.1)" — саме цю фазу й закриває
   * ФАЗА HOME+ (`introTitle`/`introHighlights` — нові поля `Course`,
   * `introDescription`/`introVideoUrl` вже існували).
   */
  featuredCourse?: RealCourse | null;
}

export function IntroSection({ featuredCourse = null }: IntroSectionProps) {
  const title = featuredCourse?.introTitle?.trim() || INTRO_LESSON.title;
  const description = featuredCourse?.introDescription?.trim() || FALLBACK_DESCRIPTION;
  const highlights =
    featuredCourse?.introHighlights && featuredCourse.introHighlights.length > 0
      ? featuredCourse.introHighlights
      : FALLBACK_HIGHLIGHTS;
  const youtubeId =
    (featuredCourse?.introVideoUrl && extractYoutubeId(featuredCourse.introVideoUrl)) ||
    INTRO_LESSON.youtubeId;

  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2">
        <VideoPlayer videoId={youtubeId} title={title} />

        <div>
          <h2 className="font-serif text-3xl text-ink sm:text-4xl">{title}</h2>
          <p className="mt-4 text-base text-muted">{description}</p>

          <ul className="mt-6 flex flex-col gap-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-ink/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
                  <CheckIcon size={12} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
