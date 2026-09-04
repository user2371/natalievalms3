import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminReportReview } from "@/components/admin/AdminReportReview";
import { reviewReportService } from "@/modules/messages";

export const dynamic = "force-dynamic";

/**
 * Сторінка "Скарга" в адмінці — ФАЗА MSG+, задача MSG+.4.2 (04.09.2026).
 * Server Component: викликає `reviewReportService` НАПРЯМУ (не через
 * `reviewReportAction` — той призначений для клієнтських викликів із
 * `requireAdmin`; доступ до самої сторінки вже перевірено
 * `middleware.ts`, той самий принцип, що вже всі інші `/admin/**`
 * сторінки). Сам виклик і є "розгляд" — пише рядок
 * `ConversationModerationLog` (докблок `service.reviewReportService`)
 * ще ДО рендеру, тому кожне відкриття цієї сторінки (в т.ч. F5) додає
 * новий рядок аудиту — так і задумано.
 */
export default async function AdminReportReviewPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; name?: string; email?: string } | undefined;
  if (!user?.id) {
    notFound();
  }

  let data;
  try {
    data = await reviewReportService(
      { userId: user.id, name: user.name ?? "", email: user.email ?? "" },
      { reportId },
    );
  } catch {
    notFound();
  }

  return (
    <div>
      <AdminPageHeader
        title="Скарга"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Скарги", href: "/admin/reports" },
          { label: "Перегляд" },
        ]}
      />

      <AdminReportReview data={data} />
    </div>
  );
}
