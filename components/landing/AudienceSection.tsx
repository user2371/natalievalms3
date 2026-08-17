import { Card } from "@/components/ui/Card";
import Image from "next/image";

const ITEMS = [
  {
    icon: "/icons/bottles.png",
    title: "Мрієш опанувати манікюр з нуля",
    description: "Без досвіду й спецосвіти — усе пояснюємо простими словами.",
  },
  {
    icon: "/icons/pens.png",
    title: "Хочеш освоїти нову професію",
    description: "Курс покриває базу, потрібну для старту в індустрії краси.",
  },
  {
    icon: "/icons/clock.png",
    title: "Любиш вчитися на практиці",
    description: "Кожен урок супроводжує домашнє завдання з реальним результатом.",
  },
  {
    icon: "/icons/star.png",
    title: "Хочеш робити красиво собі й близьким",
    description: "Навіть якщо не плануєш працювати майстром — знадобиться завжди.",
  },
];

export function AudienceSection() {
  return (
    <section className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center font-serif text-3xl text-ink sm:text-4xl">
          Цей курс для тебе, якщо ти:
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map(({ icon: IconSrc, title, description }) => (
            <Card
              key={title}
              hoverable
              className="flex flex-col items-cener gap-4 items-center justify-center"
            >
              <span className="flex  items-center justify-center block  text-accent-dark">
                <Image src={IconSrc as string} alt="" width={70} height={70} />
              </span>
              <div className="text-center">
                <h3 className="text-sm font-medium text-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
