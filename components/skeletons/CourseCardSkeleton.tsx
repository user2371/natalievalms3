import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface CourseCardSkeletonProps {
  className?: string;
}

/**
 * Скелетон картки курсу (ФАЗА SKELETON, задача SKEL.2) — повторює форму
 * `RealCourseCard`/`CourseCard` (`components/course/`): обкладинка
 * `aspect-[16/10]` у заокругленій картці `rounded-[22px]` + border
 * `border-rose-line/50`, під нею заголовок (два рядки різної ширини) і
 * рядок метаданих. Використовується в сітках `/courses` (SKEL.4) та
 * `CoursesCatalogClient`-подібних місцях, де 3-6 карток вантажаться
 * одночасно.
 */
export function CourseCardSkeleton({ className }: CourseCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[22px] border border-rose-line/50 bg-white",
        className,
      )}
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-3 p-5">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
