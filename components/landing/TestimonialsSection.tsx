import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StarIcon, SparkleIcon } from "@/components/ui/icons";

// Макетні дані відгуків (Фаза 0 — UI без бекенду). Реальні відгуки з
// модерацією через `modules/reviews` — Фаза 3+.
interface Testimonial {
  name: string;
  role: string;
  rating: 1 | 2 | 3 | 4 | 5;
  text: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Олена Ковальчук",
    role: "проходить курс 2 місяці",
    rating: 5,
    text: "Почала без жодного досвіду і вже роблю манікюр подругам. Найбільше сподобалось, що можна дивитись у своєму темпі — жодного тиску з дедлайнами.",
  },
  {
    name: "Марина Бойко",
    role: "випускниця курсу",
    rating: 5,
    text: "Пояснення дуже прості й покрокові, навіть складні теми на кшталт будови нігтя стали зрозумілими. Квізи після уроків реально допомагають закріпити матеріал.",
  },
  {
    name: "Аліна Ткаченко",
    role: "проходить курс 3 тижні",
    rating: 5,
    text: "Здивована, що курс безкоштовний і при цьому такий якісний. Домашні завдання з відео дуже мотивують — вже бачу власний прогрес від уроку до уроку.",
  },
  {
    name: "Юлія Мельник",
    role: "випускниця курсу",
    rating: 4,
    text: "Дуже зручний формат: відео, стаття і практика в одному місці. Хотілося б трохи більше прикладів дизайнів, але в цілому курс дав впевнену базу.",
  },
];

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Оцінка ${rating} з 5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <StarIcon
          key={index}
          size={15}
          className={index < rating ? "text-accent-dark" : "text-rose-line"}
        />
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section id="reviews" className="relative py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Badge icon={<SparkleIcon size={14} />}>Відгуки учениць</Badge>
          <h2 className="mt-4 font-serif text-3xl text-ink sm:text-4xl">
            Що кажуть ті, хто вже навчається
          </h2>
          <p className="mt-3 text-base text-muted">
            Реальні враження учениць курсу — від перших кроків до впевнених перших робіт.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((item) => (
            <Card key={item.name} padding="lg" className="flex flex-col gap-4">
              <RatingStars rating={item.rating} />
              <p className="flex-1 text-sm leading-relaxed text-ink/85">“{item.text}”</p>
              <div className="flex items-center gap-3 border-t border-rose-line/30 pt-4">
                <Avatar name={item.name} size={40} />
                <div>
                  <p className="text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-muted">{item.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
