import Image from "next/image";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { SparkleIcon } from "@/components/ui/icons";

export interface CourseProgressRowProps {
  title: string;
  coverImage: string;
  completedLessons: number;
  totalLessons: number;
  /** Демо-бали за курс — реальної системи балів ще немає (Фаза 5+). */
  points?: number;
}

/** Рядок курсу в секції "Пройдені курси": обкладинка, прогрес-бар, відсоток. */
export function CourseProgressRow({
  title,
  coverImage,
  completedLessons,
  totalLessons,
  points,
}: CourseProgressRowProps) {
  const percent =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="flex items-center gap-4 py-3.5">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-accent-soft">
        <Image
          src={coverImage}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-ink">{title}</p>
          {percent === 100 && (
            <Badge variant="soft" className="normal-case">
              Завершено
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted">
          {completedLessons} з {totalLessons} уроків
        </p>
        <ProgressBar value={percent} size="sm" className="mt-2" />
      </div>

      <div className="w-10 shrink-0 text-right text-xs font-medium text-muted">
        {percent}%
      </div>

      {points !== undefined && (
        <div className="shrink-0 text-right">
          <p className="flex items-center justify-end gap-1 text-base font-semibold text-ink">
            {points}
            <SparkleIcon size={14} className="text-accent-dark" />
          </p>
          <p className="text-[11px] text-muted">балів</p>
        </div>
      )}
    </div>
  );
}
