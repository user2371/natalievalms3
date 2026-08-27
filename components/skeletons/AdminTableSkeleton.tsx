import { Skeleton } from "@/components/ui/Skeleton";

interface AdminTableSkeletonProps {
  /** Кількість рядків-заглушок (за замовчуванням 6 — типова "перша сторінка" списку). */
  rows?: number;
  /** Кількість колонок-заглушок (за замовчуванням 4). */
  columns?: number;
}

/**
 * Скелетон адмінської таблиці (ФАЗА SKELETON, задача SKEL.8) — та сама
 * обгортка `overflow-x-auto rounded-2xl border border-rose-line/40 bg-white`,
 * що й реальні `AdminUsersTable`/`AdminCoursesTable`, з рядками
 * `border-b border-rose-line/20`. Один компонент для всіх адмінських
 * таблиць (users/courses/comments) — вони відрізняються лише кількістю
 * колонок, тому це параметр, а не окремий скелетон на кожну таблицю.
 */
export function AdminTableSkeleton({ rows = 6, columns = 4 }: AdminTableSkeletonProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-rose-line/40 bg-white">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-rose-line/30">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3">
                <Skeleton className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-rose-line/20 last:border-0">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3.5">
                  <Skeleton className={colIndex === 0 ? "h-4 w-32" : "h-4 w-16"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
