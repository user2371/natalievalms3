"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AdminConfirmDeleteModal } from "@/components/admin/AdminConfirmDeleteModal";
import { QuizBlock } from "@/components/lesson/QuizBlock";
import {
  GripIcon,
  DocumentIcon,
  EditIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@/components/ui/icons";
import {
  deleteQuestionAction,
  reorderQuestionsAction,
  type Question,
} from "@/modules/quizzes";
import type { QuizQuestion } from "@/lib/data/lessons";

const TYPE_LABELS: Record<string, string> = {
  TEXT: "текст",
  IMAGE: "картинка",
};

/**
 * `components/admin/AdminQuizQuestionsList.tsx` (задачі 8.4.1, 8.4.5, 8.4.6) —
 * клієнтський "острівець" у серверній `.../quiz/page.tsx`: таблиця
 * реальних питань з можливістю перегляду, редагування, зміни порядку (вгору/вниз)
 * та видалення з підтвердженням.
 */
export function AdminQuizQuestionsList({
  courseId,
  lessonId,
  lessonTitle,
  questions: initialQuestions,
  previewQuestions,
}: {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  questions: Question[];
  previewQuestions: QuizQuestion[];
}) {
  const router = useRouter();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [questions, setQuestions] = useState(initialQuestions);
  const [toDelete, setToDelete] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= questions.length || reordering) return;

    const next = [...questions];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setQuestions(next);
    setReordering(true);
    setError(null);

    const orderedQuestionIds = next.map((q) => q.id);
    const result = await reorderQuestionsAction({ lessonId, orderedQuestionIds });

    setReordering(false);
    if (!result.success) {
      setQuestions(questions); // rollback
      setError(result.error ?? "Не вдалося змінити порядок питань");
    } else {
      router.refresh();
    }
  }

  async function handleDeleteConfirm() {
    if (!toDelete) return;
    setDeleting(true);
    setError(null);

    const result = await deleteQuestionAction(toDelete.id);
    setDeleting(false);

    if (result.success) {
      setQuestions((prev) => prev.filter((q) => q.id !== toDelete.id));
      setToDelete(null);
      router.refresh();
    } else {
      setError(result.error ?? "Не вдалося видалити питання");
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {questions.length > 0 && (
        <div className="mb-4 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            icon={<DocumentIcon size={16} />}
            iconPosition="left"
            onClick={() => setPreviewOpen(true)}
          >
            Переглянути як студент
          </Button>
        </div>
      )}

      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-line/60 px-6 py-14 text-center text-sm text-muted">
          У цьому уроці ще немає питань квізу.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-rose-line/40 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-rose-line/30 text-xs tracking-wide text-muted uppercase">
                <th className="w-10 px-5 py-3 font-medium">№</th>
                <th className="px-5 py-3 font-medium">Питання</th>
                <th className="px-5 py-3 font-medium">Тип</th>
                <th className="px-5 py-3 font-medium">Відповідей</th>
                <th className="px-5 py-3 font-medium">Порядок</th>
                <th className="px-5 py-3 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, index) => (
                <tr
                  key={question.id}
                  className="border-b border-rose-line/20 last:border-0"
                >
                  <td className="px-5 py-4 text-muted">{index + 1}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 font-medium text-ink">
                      <GripIcon size={16} className="shrink-0 text-rose-line" />
                      {question.text}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="outline">
                      {TYPE_LABELS[question.type] ?? question.type}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-muted">{question.answers.length}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleMove(index, -1)}
                        disabled={index === 0 || reordering}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft disabled:opacity-30"
                        aria-label="Перемістити вище"
                      >
                        <ChevronUpIcon size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, 1)}
                        disabled={index === questions.length - 1 || reordering}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft disabled:opacity-30"
                        aria-label="Перемістити нижче"
                      >
                        <ChevronDownIcon size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/courses/${courseId}/lessons/${lessonId}/quiz/${question.id}/edit`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft hover:text-ink"
                        aria-label="Редагувати питання"
                      >
                        <EditIcon size={16} />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setToDelete(question)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                        aria-label="Видалити питання"
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
        entityLabel="це питання квізу"
        onConfirm={handleDeleteConfirm}
        submitting={deleting}
      />

      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        labelledBy="quiz-preview-heading"
        className="max-w-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-rose-line/30 p-5">
          <h2 id="quiz-preview-heading" className="font-serif text-lg text-ink">
            Попередній перегляд — {lessonTitle}
          </h2>
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="text-sm text-muted hover:text-ink"
          >
            Закрити
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">
          <QuizBlock questions={previewQuestions} />
        </div>
      </Modal>
    </div>
  );
}
