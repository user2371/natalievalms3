import { Header } from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/Skeleton";
import { CourseCardSkeleton } from "@/components/skeletons/CourseCardSkeleton";

/**
 * Скелетон `/courses` (ФАЗА SKELETON, задача SKEL.4) — замінює загальний
 * `app/loading.tsx` (кружечок-спінер по центру екрана) для цього маршруту:
 * заголовок-заглушка + сітка з 6 `CourseCardSkeleton` (той самий
 * `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`, що й реальний
 * `CoursesCatalogClient`), щоб під час SSR-запиту `listCoursesService`
 * одразу було видно форму майбутнього контенту, а не порожній екран.
 */
export default function CoursesLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-6">
          <Skeleton className="h-4 w-24" />

          <div className="mx-auto mt-6 flex max-w-xl flex-col items-center gap-2.5">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
