"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminConfirmDeleteModal } from "@/components/admin/AdminConfirmDeleteModal";
import {
  EditIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  GripIcon,
} from "@/components/ui/icons";
import { reorderLessonsAction, deleteLessonAction } from "@/modules/lessons";
import type { Lesson } from "@/modules/lessons";

/**
 * `components/admin/AdminLessonsTable.tsx` — клієнтський "острівець" у
 * серверній `app/admin/courses/[courseId]/lessons/page.tsx`, той самий
 * підхід, що й `AdminCoursesTable`: список приходить з сервера як проп
 * (`initialLessons`, уже відсортований за `order`), далі — локальний
 * `useState` для optimistic-оновлень.
 *
 * - **8.2.4** — стрілки вгору/вниз міняють два сусідні уроки місцями і
 *   одразу відправляють ПОВНИЙ новий порядок через `reorderLessonsAction`
 *   (`{ courseId, orderedLessonIds }`) — той самий контракт, що вже
 *   існував із Фази 3 (не чіпали); optimistic-перестановка з відкатом при
 *   помилці.
 * - **8.2.5** — видалення уроку з попередженням про каскад (стаття, квіз,
 *   коментарі й прогрес учнів по цьому уроку видаляться разом з ним —
 *   `onDelete: Cascade` у Prisma-схемі для `Article`/`Quiz`/`Comment`/
 *   `Progress`/`HomeworkSubmission` з `lessonId`).
 */
export function AdminLessonsTable({
  courseId,
  initialLessons,
}: {
  courseId: string;
  initialLessons: Lesson[];
}) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [toDelete, setToDelete] = useState<Lesson | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const snapshot = lessons;
    const reordered = [...lessons];
    [reordered[index], reordered[targetIndex]] = [
      reordered[targetIndex],
      reordered[index],
    ];
    setError(null);
    setLessons(reordered);

    startTransition(async () => {
      const result = await reorderLessonsAction({
        courseId,
        orderedLessonIds: reordered.map((lesson) => lesson.id),
      });
      if (result.success && result.lessons) {
        setLessons(result.lessons);
      } else {
        setLessons(snapshot);
        setError(result.error ?? "Не вдалося змінити порядок уроків");
      }
    });
  }

  function handleConfirmDelete() {
    if (!toDelete) return;
    const removed = toDelete;
    const snapshot = lessons;
    setToDelete(null);
    setError(null);
    setLessons((prev) => prev.filter((lesson) => lesson.id !== removed.id));

    startTransition(async () => {
      const result = await deleteLessonAction(removed.id);
      if (!result.success) {
        setLessons(snapshot);
        setError(result.error ?? "Не вдалося видалити урок");
      }
    });
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-line/60 px-6 py-14 text-center text-sm text-muted">
          У цьому курсі ще немає уроків.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-rose-line/40 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-rose-line/30 text-xs tracking-wide text-muted uppercase">
                <th className="w-10 px-5 py-3 font-medium">№</th>
                <th className="px-5 py-3 font-medium">Назва</th>
                <th className="px-5 py-3 font-medium">Тривалість</th>
                <th className="px-5 py-3 font-medium">Порядок</th>
                <th className="px-5 py-3 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((lesson, index) => (
                <tr
                  key={lesson.id}
                  className="border-b border-rose-line/20 last:border-0"
                >
                  <td className="px-5 py-4 text-muted">{lesson.order}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 font-medium text-ink">
                      <GripIcon size={16} className="shrink-0 text-rose-line" />
                      {lesson.title}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted">{lesson.duration ?? "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={isPending || index === 0}
                        aria-label={`Підняти урок "${lesson.title}"`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronUpIcon size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={isPending || index === lessons.length - 1}
                        aria-label={`Опустити урок "${lesson.title}"`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <ChevronDownIcon size={15} />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/courses/${courseId}/lessons/${lesson.id}/edit`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft hover:text-ink"
                        aria-label={`Редагувати урок "${lesson.title}"`}
                      >
                        <EditIcon size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setToDelete(lesson)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label={`Видалити урок "${lesson.title}"`}
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminConfirmDeleteModal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        entityLabel={toDelete ? `урок "${toDelete.title}"` : ""}
        warning="Стаття, квіз, коментарі та прогрес учнів по цьому уроку будуть видалені назавжди."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
