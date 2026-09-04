import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReportsList } from "@/components/admin/AdminReportsList";
import { listMessageReportsService } from "@/modules/messages";

export const dynamic = 'force-dynamic'
/**
 * Сторінка "Скарги" в адмінці — ФАЗА MSG+, задача MSG+.4.2 (04.09.2026).
 * Server Component — той самий патерн, що вже `/admin/comments`:
 * вантажить репорти напряму сервісом (доступ уже перевірений
 * `middleware.ts`, роль ADMIN на всьому `/admin/**`), передає в
 * клієнтський список.
 */
export default async function AdminReportsPage() {
  const reports = await listMessageReportsService();

  return (
    <div>
      <AdminPageHeader
        title="Скарги"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Скарги" },
        ]}
      />

      <AdminReportsList reports={reports} />
    </div>
  );
}
