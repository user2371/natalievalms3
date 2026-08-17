import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { PlayIcon, DocumentIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { extractYoutubeId } from "@/lib/youtube";
import { youtubeThumbnail } from "@/lib/data/lessons";
import type { Lesson } from "@/modules/lessons";

export interface RealLessonCardProps {
  lesson: Lesson;
  /** `slug` курсу, до якого належить урок — для формування `href`. */
  courseSlug: string;
  className?: string;
}

/**
 * Картка реального (Prisma) уроку — паралельний варіант `LessonCard.tsx`
 * (задача 3.12), що лишається як був для існуючого статичного `/lessons`
 * флоу. Тут інша адреса (`/courses/[slug]/lessons/[lessonId]`, `id` замість
 * `slug` уроку) і мініатюра рахується з `videoUrl` на льоту через
 * `extractYoutubeId`, а не з готового `youtubeId`. Той самий принцип "уроки
 * не блокуються" — жодного заблокованого стану.
 */
export function RealLessonCard({ lesson, courseSlug, className }: RealLessonCardProps) {
  const href = `/courses/${courseSlug}/lessons/${lesson.id}`;
  const youtubeId =
    lesson.videoProvider === "YOUTUBE" ? extractYoutubeId(lesson.videoUrl) : null;

  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-rose-line/40 bg-white text-center shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <span className="left-3 top-3 rounded-full bg-white/90 px-10 py-3 text-xs font-medium text-accent-dark">
        Урок {lesson.order}
      </span>
      <Link
        href={href}
        className="group relative block aspect-video overflow-hidden bg-ink"
      >
        {youtubeId ? (
          <Image
            src={youtubeThumbnail(youtubeId)}
            alt={lesson.title}
            fill
            sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-90 transition-transform duration-200 group-hover:scale-105"
          />
        ) : null}
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
        <Link href={href} className="mt-auto">
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
