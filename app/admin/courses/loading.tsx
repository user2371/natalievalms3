import { AdminPageHeaderSkeleton } from "@/components/skeletons/AdminPageHeaderSkeleton";
import { AdminTableSkeleton } from "@/components/skeletons/AdminTableSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Скелетон `/admin/courses` (ФАЗА SKELETON, задача SKEL.8) — замінює
 * компактний спінер з `app/admin/loading.tsx` саме для цього маршруту
 * (Next віддає перевагу найглибшому `loading.tsx` по дереву сегментів):
 * заголовок з кнопкою "Додати курс", смужка `FeaturedCoursePicker`
 * (`Select`-подібний блок) і таблиця (Назва/Slug/Опубліковано/Дії — 4
 * колонки, як `AdminCoursesTable`).
 */
export default function AdminCoursesLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton />
      <Skeleton className="mb-6 h-16 w-full rounded-2xl" />
      <AdminTableSkeleton rows={6} columns={4} />
    </div>
  );
}
