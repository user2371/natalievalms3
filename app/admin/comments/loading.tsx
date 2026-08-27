import { AdminPageHeaderSkeleton } from "@/components/skeletons/AdminPageHeaderSkeleton";
import { AdminTableSkeleton } from "@/components/skeletons/AdminTableSkeleton";

/**
 * Скелетон `/admin/comments` (ФАЗА SKELETON, задача SKEL.8) — заголовок
 * без кнопки дії (`AdminCommentsPage` не має "+ Додати") + таблична
 * заглушка (3 колонки: автор/текст/урок, коротший ряд, ніж курси/юзери).
 */
export default function AdminCommentsLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton withAction={false} />
      <AdminTableSkeleton rows={8} columns={3} />
    </div>
  );
}
