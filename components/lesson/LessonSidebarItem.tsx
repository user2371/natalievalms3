import Link from "next/link";
import Image from "next/image";
import { PlayIcon, CheckIcon, ClockIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { youtubeThumbnail, type Lesson } from "@/lib/data/lessons";

export type LessonSidebarStatus = "completed" | "current" | "incomplete";

export interface LessonSidebarItemProps {
  lesson: Lesson;
  status: LessonSidebarStatus;
  className?: string;
}

function StatusIcon({ status }: { status: LessonSidebarStatus }) {
  if (status === "completed") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckIcon size={13} />
      </span>
    );
  }

  if (status === "current") {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-white">
        <PlayIcon size={11} />
      </span>
    );
  }

  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-rose-line/60" />;
}

export function LessonSidebarItem({ lesson, status, className }: LessonSidebarItemProps) {
  const isCurrent = status === "current";

  return (
    <Link
      href={`/lessons/${lesson.slug}`}
      aria-current={isCurrent ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 border-l-[3px] px-3 py-2.5 transition-colors",
        isCurrent
          ? "border-accent bg-accent-soft/40"
          : "border-transparent hover:bg-cream-soft/70",
        className,
      )}
    >
      <span className="relative aspect-video w-16 shrink-0 overflow-hidden rounded-lg bg-ink">
        <Image
          src={youtubeThumbnail(lesson.youtubeId)}
          alt={lesson.title}
          fill
          sizes="64px"
          className="object-cover opacity-90"
          unoptimized
        />
      </span>

      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "text-[11px] font-medium",
            isCurrent ? "text-accent-dark" : "text-muted",
          )}
        >
          Урок {lesson.number}
        </span>
        <h3
          className={cn(
            "mt-0.5 line-clamp-2 text-sm font-medium",
            isCurrent ? "text-ink" : "text-ink/85 group-hover:text-ink",
          )}
        >
          {lesson.title}
        </h3>
        {lesson.durationLabel && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted">
            <ClockIcon size={11} />
            {lesson.durationLabel}
          </span>
        )}
      </div>

      <StatusIcon status={status} />
    </Link>
  );
}
