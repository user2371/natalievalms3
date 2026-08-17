import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminCommentsList } from "@/components/admin/AdminCommentsList";
import { listAllCommentsService } from "@/modules/comments";

/**
 * Сторінка "Коментарі" в адмінці (задачі 8.5.1, 8.5.2).
 * Server Component — вантажить реальні коментарі з БД і передає в `AdminCommentsList`.
 */
export default async function AdminCommentsPage() {
  const comments = await listAllCommentsService();

  return (
    <div>
      <AdminPageHeader
        title="Коментарі"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Коментарі" },
        ]}
      />

      <AdminCommentsList comments={comments} />
    </div>
  );
}
