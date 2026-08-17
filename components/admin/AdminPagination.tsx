"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface AdminPaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

/**
 * Пагінація списків адмінки ("‹ 1 2 3 ›" у мокапі `adminPanel.png`).
 * На відміну від мокапу (де для 4 курсів намальовано статичні "1 2 3" —
 * ілюстративний надлишок), тут — робоча пагінація за реальною кількістю
 * елементів: з поточними мок-даними (4 курси / 3 коментарі / 3 юзери,
 * `pageSize` 10) сторінка завжди одна, і компонент коректно ховає
 * стрілки/зайві номери, а не малює порожні сторінки для вигляду.
 */
export function AdminPagination({ page, pageCount, onPageChange }: AdminPaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Пагінація" className="mt-5 flex items-center justify-center gap-1.5">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-soft disabled:opacity-30"
        aria-label="Попередня сторінка"
      >
        <ChevronLeftIcon size={16} />
      </button>

      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm transition-colors",
            p === page ? "bg-accent text-white" : "text-ink hover:bg-cream-soft",
          )}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-soft disabled:opacity-30"
        aria-label="Наступна сторінка"
      >
        <ChevronRightIcon size={16} />
      </button>
    </nav>
  );
}
