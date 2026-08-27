import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface LessonCardSkeletonProps {
  className?: string;
}

/**
 * Скелетон картки уроку (ФАЗА SKELETON, задача SKEL.2) — для сітки
 * "Програма курсу" на `/courses/[slug]` (SKEL.5) і `/lessons`
 * (`RealLessonCard`/`LessonListCard`): невелика мініатюра зліва
 * (16:9, як YouTube-thumbnail) + заголовок і рядок статусу/тривалості
 * справа. Простіша за `CourseCardSkeleton` — без великої обкладинки на
 * всю ширину, урок у списку компактніший за курс у каталозі.
 */
export function LessonCardSkeleton({ className }: LessonCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-rose-line/50 bg-white p-3",
        className,
      )}
    >
      <Skeleton className="aspect-video w-24 shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-full max-w-[180px]" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
