import { Skeleton } from "@/components/ui/Skeleton";
import { ListRowSkeleton } from "@/components/skeletons/ListRowSkeleton";

interface AccountPageSkeletonProps {
  /** Кількість рядків списку-заглушки (за замовчуванням 4). */
  rows?: number;
}

/**
 * Загальний скелетон сторінки кабінету (ФАЗА SKELETON, задача SKEL.7) —
 * для сторінок простіших за `/profile` (без `ProfileHero`): заголовок +
 * короткий опис + вертикальний список `ListRowSkeleton`. Використовується
 * як на `/my-learning`/`/homework` (список курсів/відео ДЗ), так і як
 * заглушка на час `status === "loading"` для `/settings`, де реальний
 * контент — форма, а не список (список тут — достатньо нейтральна форма
 * "тут буде контент", без спроби повторити поля форми один-в-один).
 */
export function AccountPageSkeleton({ rows = 4 }: AccountPageSkeletonProps) {
  return (
    <div>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2.5 h-4 w-full max-w-md" />

      <div className="mt-8 flex flex-col gap-1 divide-y divide-cream-soft rounded-2xl border border-rose-line/40 bg-white px-5">
        {Array.from({ length: rows }).map((_, i) => (
          <ListRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
