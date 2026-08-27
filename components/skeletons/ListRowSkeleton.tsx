import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface ListRowSkeletonProps {
  className?: string;
}

/**
 * Скелетон одного рядка списку (ФАЗА SKELETON, задача SKEL.3) — квадратна
 * мініатюра `h-14 w-14 rounded-xl` зліва (той самий розмір, що обкладинка
 * в `CourseProgressRow.tsx`) + два рядки тексту справа. Спільний для
 * "Пройдені курси" (`CourseProgressRow`), "Мої домашні завдання" (без
 * плеєра, лише список назв на `/homework`) і рядків `/my-learning` —
 * всюди, де контент — це вертикальний список однотипних елементів, а не
 * сітка карток (для карток — `CourseCardSkeleton`/`LessonCardSkeleton`).
 */
export function ListRowSkeleton({ className }: ListRowSkeletonProps) {
  return (
    <div className={cn("flex items-center gap-4 py-3.5", className)}>
      <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3 max-w-xs" />
        <Skeleton className="h-3 w-1/3 max-w-[140px]" />
      </div>
      <Skeleton className="h-4 w-10 shrink-0" />
    </div>
  );
}
