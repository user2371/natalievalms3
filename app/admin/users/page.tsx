import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { listUsersService } from "@/modules/users";

export const dynamic = 'force-dynamic'
/**
 * Сторінка "Користувачі" в адмінці (задачі 8.6.1, 8.6.2).
 * Server Component — вантажить реальних користувачів з БД і передає в `AdminUsersTable`.
 */
export default async function AdminUsersPage() {
  const users = await listUsersService();

  return (
    <div>
      <AdminPageHeader
        title="Користувачі"
        breadcrumb={[{ label: "Головна", href: "/admin/courses" }, { label: "Юзери" }]}
      />

      <AdminUsersTable users={users} />
    </div>
  );
}
