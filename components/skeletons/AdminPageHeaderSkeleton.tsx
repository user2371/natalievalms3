import { Skeleton } from "@/components/ui/Skeleton";

interface AdminPageHeaderSkeletonProps {
  /** Показувати заглушку кнопки дії справа (напр. "+ Додати курс"). */
  withAction?: boolean;
}

/**
 * Скелетон `AdminPageHeader` (ФАЗА SKELETON, задача SKEL.8) — рядок
 * хлібних крихт + заголовок зліва, опційна кнопка справа. Спільний для
 * всіх адмінських `loading.tsx` (courses/comments/users), бо
 * `AdminPageHeader` сам по собі не залежить від async-даних (title/
 * breadcrumb — статичні рядки в кожній сторінці) і формою однаковий
 * усюди — відрізняється лише наявністю кнопки дії.
 */
export function AdminPageHeaderSkeleton({ withAction = true }: AdminPageHeaderSkeletonProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-2.5 h-7 w-40" />
      </div>
      {withAction && <Skeleton className="h-9 w-36 rounded-full" />}
    </div>
  );
}
