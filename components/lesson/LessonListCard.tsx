import Link from "next/link";
import Image from "next/image";
import { PlayIcon, ClockIcon, CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { youtubeThumbnail, type Lesson } from "@/lib/data/lessons";

export interface LessonListCardProps {
  lesson: Lesson;
  /** Лише позначка "пройдено/не пройдено" — ніколи не впливає на доступ до уроку. */
  completed?: boolean;
  className?: string;
}

export function LessonListCard({
  lesson,
  completed = false,
  className,
}: LessonListCardProps) {
  return (
    <Link
      href={`/lessons/${lesson.slug}`}
      className={cn(
        "group flex items-center gap-4 rounded-2xl border border-rose-line/40 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4",
        className,
      )}
    >
      <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-xl bg-ink sm:w-36">
        <Image
          src={youtubeThumbnail(lesson.youtubeId)}
          alt={lesson.title}
          fill
          sizes="144px"
          className="object-cover opacity-90 transition-transform duration-200 group-hover:scale-105"
          unoptimized
        />
        <span className="absolute inset-0 flex items-center justify-center bg-ink/20">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-accent-dark">
            <PlayIcon size={14} />
          </span>
        </span>
      </span>

      <div className="min-w-0 flex-1">
        <span className="text-xs font-medium text-accent-dark">Урок {lesson.number}</span>
        <h3 className="mt-0.5 truncate text-sm font-medium text-ink sm:text-base">
          {lesson.title}
        </h3>
        {lesson.durationLabel && (
          <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted">
            <ClockIcon size={13} />
            {lesson.durationLabel}
          </span>
        )}
      </div>

      <span
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium",
          completed
            ? "bg-success/15 text-success"
            : "border border-rose-line/50 text-muted",
        )}
      >
        {completed ? (
          <>
            <CheckIcon size={13} />
            <span className="hidden sm:inline">Пройдено</span>
          </>
        ) : (
          <span>Не пройдено</span>
        )}
      </span>
    </Link>
  );
}
