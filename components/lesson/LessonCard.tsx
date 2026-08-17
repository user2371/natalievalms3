import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { PlayIcon, DocumentIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { youtubeThumbnail, type Lesson } from "@/lib/data/lessons";

export interface LessonCardProps {
  lesson: Lesson;
  className?: string;
}

/**
 * Картка уроку в програмі курсу. Усі уроки завжди відкриті й клікабельні —
 * жодних замків чи заблокованого стану (бізнес-правило: уроки не блокуються).
 */
export function LessonCard({ lesson, className }: LessonCardProps) {
  const href = `/lessons/${lesson.slug}`;

  return (
    <div
      className={cn(
        "text-center flex w-full flex-col overflow-hidden rounded-2xl border border-rose-line/40 bg-white shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <span className=" left-3 top-3 rounded-full bg-white/90 px-10 py-3 text-xs font-medium text-accent-dark">
        Урок {lesson.number}
      </span>
      <Link
        href={href}
        className="group relative block aspect-video overflow-hidden bg-ink"
      >
        <Image
          src={youtubeThumbnail(lesson.youtubeId)}
          alt={lesson.title}
          fill
          sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-90 transition-transform duration-200 group-hover:scale-105"
          unoptimized
        />
        <span className="absolute inset-0 flex items-center justify-center bg-ink/20 transition-colors group-hover:bg-ink/30">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-accent-dark">
            <PlayIcon size={18} />
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link
          href={href}
          className="line-clamp-2 text-sm font-medium text-ink hover:text-accent-dark"
        >
          {lesson.title}
        </Link>
        <Link href={`${href}#quiz`} className="mt-auto">
          <Button
            variant="outline"
            size="sm"
            icon={<DocumentIcon size={16} />}
            iconPosition="left"
            fullWidth
          >
            Почати урок
          </Button>
        </Link>
      </div>
    </div>
  );
}
