import { AdminPageHeaderSkeleton } from "@/components/skeletons/AdminPageHeaderSkeleton";
import { AdminTableSkeleton } from "@/components/skeletons/AdminTableSkeleton";

/**
 * Скелетон `/admin/users` (ФАЗА SKELETON, задача SKEL.8) — заголовок без
 * кнопки дії + таблиця (5 колонок: ім'я/email/роль/дата реєстрації/дії,
 * ширша за коментарі — `AdminUsersTable` має `min-w-[760px]`).
 */
export default function AdminUsersLoading() {
  return (
    <div>
      <AdminPageHeaderSkeleton withAction={false} />
      <AdminTableSkeleton rows={7} columns={5} />
    </div>
  );
}
