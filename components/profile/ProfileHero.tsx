import Image from "next/image";
import Link from "next/link";
import { CalendarIcon, CrownIcon, SparkleIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface ProfileHeroProps {
  name: string;
  handle: string;
  photoUrl: string;
  bio: string;
  /** ISO-дата реєстрації. */
  joinedAt: string;
  points: number;
  rank: number;
  rankOutOf: number;
  className?: string;
}

const JOINED_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Hero-блок профілю (задача 0.9.1): прямокутне фото, ім'я + нікнейм, дата
 * реєстрації, "про себе" і картка балів/рейтингу — за макетом
 * `ProfilePage.png`.
 *
 * Спільний для приватного `/profile` і публічного `/users/[id]` (задача
 * 0.9): за прямим уточненням від користувача публічна сторінка профілю має
 * виглядати ІДЕНТИЧНО приватній, лише без сайдбару кабінету — тому це один
 * компонент, а не окрема "спрощена" версія з пігулками (як спершу
 * припускав текст задачі 0.9.2 без мокапу перед очима). Клік на аватар під
 * коментарем (`CommentCard`) чи в таблиці рейтингу (0.10b.3) веде саме на
 * цю сторінку через `/users/[id]`. Місце в рейтингу нижче — тепер клікабельне,
 * веде на `/leaderboard` (задача 0.10b, підключено 17.07.2026, сесія 6).
 */
export function ProfileHero({
  name,
  handle,
  photoUrl,
  bio,
  joinedAt,
  points,
  rank,
  rankOutOf,
  className,
}: ProfileHeroProps) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_240px]", className)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-accent-soft lg:aspect-auto lg:h-full">
        <Image
          src={photoUrl}
          alt={name}
          fill
          sizes="260px"
          className="object-cover"
          unoptimized
        />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-ink">{name}</h2>
        <p className="mt-1 text-sm font-medium text-accent-dark">{handle}</p>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/80">{bio}</p>
        <div className="mt-5 flex items-center gap-2 text-sm text-muted">
          <CalendarIcon size={16} />
          <span>
            Дата реєстрації
            <br />
            <span className="text-ink">
              {JOINED_FORMATTER.format(new Date(joinedAt))}
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-rose-line/40 bg-white p-6">
        <div>
          <p className="text-xs text-muted">Мої бали</p>
          <p className="mt-1 flex items-center gap-1.5 font-serif text-3xl text-ink">
            {points}
            <SparkleIcon size={20} className="text-accent-dark" />
          </p>
          <p className="mt-1 text-xs text-muted">
            Бали нараховуються за проходження уроків та квізів
          </p>
        </div>

        <Link
          href="/leaderboard"
          className="block border-t border-cream-soft pt-5 transition-opacity hover:opacity-80"
        >
          <p className="text-xs text-muted">Місце в рейтингу</p>
          <div className="mt-1 flex items-center gap-2">
            <p className="font-serif text-3xl text-ink">#{rank}</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft/60 text-accent-dark">
              <CrownIcon size={16} />
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">у топ {rankOutOf}</p>
        </Link>
      </div>
    </div>
  );
}
