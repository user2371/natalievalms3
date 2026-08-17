import { VideoPlayer } from "@/components/lesson/VideoPlayer";
import { CheckIcon } from "@/components/ui/icons";
import { INTRO_LESSON } from "@/lib/data/lessons";

// Текст нижче відповідає майбутнім редагованим полям курсу
// (Course.introTitle / Course.introDescription / Course.introHighlights — Фаза 8.1).
const PROGRAM_HIGHLIGHTS = [
  "Анатомія нігтя та поширені захворювання",
  "Інструменти, дезінфекція та підготовка",
  "Матеріали для гель-лаку та нарощування",
  "Покриття, зняття та дизайн нігтів крок за кроком",
];

export function IntroSection() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 lg:grid-cols-2">
        <VideoPlayer videoId={INTRO_LESSON.youtubeId} title={INTRO_LESSON.title} />

        <div>
          <h2 className="font-serif text-3xl text-ink sm:text-4xl">
            {INTRO_LESSON.title}
          </h2>
          <p className="mt-4 text-base text-muted">
            Перш ніж перейти до практики, познайомся з курсом і майстринею: чого чекати
            від навчання, як побудована програма і що знадобиться для перших уроків. Це
            коротке відео допоможе налаштуватися на результат.
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {PROGRAM_HIGHLIGHTS.map((item) => (
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
