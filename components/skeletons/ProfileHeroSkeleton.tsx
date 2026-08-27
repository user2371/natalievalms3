import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

interface ProfileHeroSkeletonProps {
  className?: string;
}

/**
 * Скелетон `ProfileHero` (ФАЗА SKELETON, задача SKEL.3) — та сама
 * трьохколонкова сітка `grid-cols-1 lg:grid-cols-[260px_1fr_240px]`, що й
 * реальний компонент (`components/profile/ProfileHero.tsx`): фото
 * `aspect-[4/5]`, колонка імені/нікнейму/біо/дати посередині, картка
 * балів/рейтингу `rounded-2xl border` справа. Використовується на
 * `/profile` і `/users/[id]` (SKEL.6/SKEL.7), поки `getPublicProfileAction`
 * ще не повернув дані — і на час `status === "loading"` сесії (SKEL.6.1),
 * коли ці сторінки раніше показували порожній `return null`.
 */
export function ProfileHeroSkeleton({ className }: ProfileHeroSkeletonProps) {
  return (
    <div
      className={cn("grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr_240px]", className)}
    >
      <Skeleton className="aspect-[4/5] w-full rounded-2xl lg:aspect-auto lg:h-full" />

      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-24" />
        <Skeleton className="mt-4 h-4 w-full max-w-md" />
        <Skeleton className="mt-1.5 h-4 w-2/3 max-w-md" />
        <Skeleton className="mt-5 h-8 w-40" />
      </div>

      <div className="flex flex-col gap-6 rounded-2xl border border-rose-line/40 bg-white p-6">
        <div>
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-2 h-8 w-20" />
          <Skeleton className="mt-2 h-3 w-full" />
        </div>
        <div className="border-t border-cream-soft pt-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-8 w-16" />
          <Skeleton className="mt-2 h-3 w-14" />
        </div>
      </div>
    </div>
  );
}
