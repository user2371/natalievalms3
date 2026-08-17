import {
  UserIcon,
  PlayIcon,
  DocumentIcon,
  DiplomaIcon,
  ChevronRightIcon,
} from "@/components/ui/icons";

const STEPS = [
  { icon: UserIcon, title: "Зареєструйся", description: "Менше 1 хвилини, без карти" },
  { icon: PlayIcon, title: "Дивись уроки", description: "У своєму темпі й порядку" },
  {
    icon: DocumentIcon,
    title: "Проходь квізи",
    description: "Перевіряй знання після уроку",
  },
  {
    icon: DiplomaIcon,
    title: "Отримай сертифікат",
    description: "Після завершення курсу",
  },
];

export function StepsSection() {
  return (
    <section className="relative py-16 sm:py-10">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">
          Як це працює
        </h2>

        <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {STEPS.map((step, i) => (
            <div key={step.title} className="flex items-center gap-3 sm:contents">
              <div className="flex flex-1 flex-col items-center gap-3 rounded-2xl border border-rose-line/40 bg-white p-6 text-center sm:flex-none sm:w-56">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
                  <step.icon size={22} />
                </span>
                <div>
                  <h3 className="text-sm font-medium text-ink">
                    {i + 1}. {step.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted">{step.description}</p>
                </div>
              </div>
              {i < STEPS.length - 1 && (
                <span className="hidden shrink-0 text-rose-line sm:block" aria-hidden>
                  <ChevronRightIcon size={50} />
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
