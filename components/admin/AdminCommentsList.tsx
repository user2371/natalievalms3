"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminConfirmDeleteModal } from "@/components/admin/AdminConfirmDeleteModal";
import { TrashIcon } from "@/components/ui/icons";
import { deleteCommentAction, type AdminCommentItem } from "@/modules/comments";

const PAGE_SIZE = 10;

/**
 * `components/admin/AdminCommentsList.tsx` (задачі 8.5.1, 8.5.2) —
 * клієнтський "острівець" для модерації коментарів: відображення списку
 * реальних коментарів з БД, пагінація, фільтр та видалення з підтвердженням
 * через `deleteCommentAction`.
 */
export function AdminCommentsList({
  comments: initialComments,
}: {
  comments: AdminCommentItem[];
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<AdminCommentItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(comments.length / PAGE_SIZE));
  const visible = comments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDeleteConfirm() {
    if (!toDelete) return;
    setDeleting(true);
    setError(null);

    const result = await deleteCommentAction({ id: toDelete.id });
    setDeleting(false);

    if (result.success) {
      setComments((prev) => prev.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
      router.refresh();
    } else {
      setError(result.error ?? "Не вдалося видалити коментар");
    }
  }

  function formatAuthorName(comment: AdminCommentItem) {
    const { firstName, lastName, nickname } = comment.author;
    if (nickname) return `@${nickname}`;
    return [firstName, lastName].filter(Boolean).join(" ") || "Користувач";
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {comments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-line/60 px-6 py-14 text-center text-sm text-muted">
          Коментарів поки немає.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-rose-line/40 bg-white">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead>
              <tr className="border-b border-rose-line/30 text-xs tracking-wide text-muted uppercase">
                <th className="px-5 py-3 font-medium">Автор</th>
                <th className="px-5 py-3 font-medium">Урок</th>
                <th className="px-5 py-3 font-medium">Текст</th>
                <th className="px-5 py-3 font-medium">Дата</th>
                <th className="px-5 py-3 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((comment) => (
                <tr
                  key={comment.id}
                  className="border-b border-rose-line/20 last:border-0"
                >
                  <td className="px-5 py-4 font-medium text-ink">
                    {formatAuthorName(comment)}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-muted">
                    {comment.lessonTitle}
                  </td>
                  <td className="max-w-xs truncate px-5 py-4 text-muted">
                    {comment.content}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {new Date(comment.createdAt).toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setToDelete(comment)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      aria-label="Видалити коментар"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {comments.length > PAGE_SIZE && (
        <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
      )}

      <AdminConfirmDeleteModal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        entityLabel="цей коментар"
        onConfirm={handleDeleteConfirm}
        submitting={deleting}
      />
    </div>
  );
}
