"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { AdminConfirmDeleteModal } from "@/components/admin/AdminConfirmDeleteModal";
import { Switch } from "@/components/ui/Switch";
import { EditIcon, TrashIcon } from "@/components/ui/icons";
import { deleteCourseAction, updateCourseAction } from "@/modules/courses";
import type { Course } from "@/modules/courses";

const PAGE_SIZE = 10;

/**
 * `components/admin/AdminCoursesTable.tsx` — клієнтський "острівець" у
 * серверній `app/admin/courses/page.tsx` (задача 8.1.1), той самий
 * підхід, що й `RealCommentsBlock`/`RealLeaderboardBlock`: список
 * приходить з сервера як проп (`initialCourses`), далі — локальний
 * `useState` для оптимістичних оновлень.
 *
 * - **8.1.4** — перемикач "Опубліковано" прямо в таблиці, без переходу на
 *   сторінку редагування: `updateCourseAction(formData)` з `published`
 *   перемкнутим (F.29: дія тепер приймає `FormData`, не типізований
 *   об'єкт — див. `modules/courses/actions.ts`), optimistic-перемикання з
 *   відкатом при помилці.
 * - **8.1.5** — видалення курсу з попередженням про каскад (усі уроки,
 *   прогрес і коментарі курсу видаляться разом з ним — `onDelete: Cascade`
 *   у Prisma-схемі для `Lesson.courseId`/`Progress`/`Comment`/`Enrollment`).
 */
export function AdminCoursesTable({ initialCourses }: { initialCourses: Course[] }) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pageCount = Math.max(1, Math.ceil(courses.length / PAGE_SIZE));
  const visible = courses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleTogglePublished(course: Course) {
    const nextPublished = !course.published;
    setError(null);
    setCourses((prev) =>
      prev.map((c) => (c.id === course.id ? { ...c, published: nextPublished } : c)),
    );

    startTransition(async () => {
      const formData = new FormData();
      formData.append("id", course.id);
      formData.append("title", course.title);
      formData.append("description", course.description);
      formData.append("introVideoUrl", course.introVideoUrl ?? "");
      formData.append("introDescription", course.introDescription ?? "");
      formData.append("published", String(nextPublished));
      // Обкладинку тут НЕ чіпаємо — ні `coverImage` (файл), ні
      // `removeCoverImage` не додаються в `FormData`, тому
      // `updateCourseAction` (`modules/courses/actions.ts`) лишає
      // `coverImage` без змін (`undefined` — "не чіпати", той самий
      // принцип, що вже в самій дії).
      const result = await updateCourseAction(formData);
      if (!result.success) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, published: course.published } : c,
          ),
        );
        setError(result.error ?? "Не вдалося змінити статус публікації");
      }
    });
  }

  function handleConfirmDelete() {
    if (!toDelete) return;
    const removed = toDelete;
    setToDelete(null);
    setError(null);
    setCourses((prev) => prev.filter((c) => c.id !== removed.id));

    startTransition(async () => {
      const result = await deleteCourseAction(removed.id);
      if (!result.success) {
        setCourses((prev) => [...prev, removed]);
        setError(result.error ?? "Не вдалося видалити курс");
      }
    });
  }

  return (
    <div>
      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-line/60 px-6 py-14 text-center text-sm text-muted">
          Курсів поки немає.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-rose-line/40 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-rose-line/30 text-xs tracking-wide text-muted uppercase">
                <th className="px-5 py-3 font-medium">Назва</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Опубліковано</th>
                <th className="px-5 py-3 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((course) => (
                <tr
                  key={course.id}
                  className="border-b border-rose-line/20 last:border-0"
                >
                  <td className="px-5 py-4">
                    <Link
                      href={`/admin/courses/${course.id}`}
                      className="font-medium text-ink hover:text-accent-dark"
                    >
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-muted">{course.slug}</td>
                  <td className="px-5 py-4">
                    <Switch
                      checked={course.published}
                      onChange={() => handleTogglePublished(course)}
                      disabled={isPending}
                      aria-label={`Опубліковано: ${course.title}`}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/courses/${course.id}/edit`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft hover:text-ink"
                        aria-label={`Редагувати курс "${course.title}"`}
                      >
                        <EditIcon size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setToDelete(course)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label={`Видалити курс "${course.title}"`}
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

      <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />

      <AdminConfirmDeleteModal
        open={toDelete !== null}
        onClose={() => setToDelete(null)}
        entityLabel={toDelete ? `курс "${toDelete.title}"` : ""}
        warning="Усі уроки, статті, квізи, прогрес учнів і коментарі цього курсу будуть видалені назавжди."
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
