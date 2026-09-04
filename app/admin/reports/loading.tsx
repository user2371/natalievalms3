import { AdminPageHeaderSkeleton } from "@/components/skeletons/AdminPageHeaderSkeleton";
import { AdminTableSkeleton } from "@/components/skeletons/AdminTableSkeleton";

/**
 * Скелетон `/admin/reports` (той самий патерн, що вже
 * `/admin/comments/loading.tsx`) — заголовок без кнопки дії + таблична
 * заглушка (5 колонок: статус/скаржник/автор/причина/дата).
 */
export default function AdminReportsLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton withAction={false} />
      <AdminTableSkeleton rows={8} columns={5} />
    </div>
  );
}
