"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QuestionForm, type QuestionFormValues } from "@/components/admin/QuestionForm";
import { updateQuestionAction, type Question } from "@/modules/quizzes";

/**
 * `components/admin/AdminEditQuestionForm.tsx` (задачі 8.4.4, 8.4.6) —
 * обгортка над `QuestionForm` для редагування існуючого питання квізу
 * через `updateQuestionAction`.
 */
export function AdminEditQuestionForm({
  courseId,
  lessonId,
  question,
}: {
  courseId: string;
  lessonId: string;
  question: Question;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quizListHref = `/admin/courses/${courseId}/lessons/${lessonId}/quiz`;

  async function handleSubmit(values: QuestionFormValues) {
    setSubmitting(true);
    setError(null);

    const result = await updateQuestionAction({
      id: question.id,
      type: values.type === "image" ? "IMAGE" : "TEXT",
      text: values.text,
      imageUrl: values.type === "image" ? values.imageUrl.trim() || null : null,
      answers: values.answers.map((a) => ({
        id: a.id.startsWith("new-answer-") ? undefined : a.id,
        text: a.text,
        isCorrect: a.isCorrect,
      })),
    });

    if (result.success) {
      router.push(quizListHref);
    } else {
      setSubmitting(false);
      setError(result.error ?? "Не вдалося оновити питання");
    }
  }

  return (
    <QuestionForm
      initial={{
        type: question.type === "IMAGE" ? "image" : "text",
        text: question.text,
        imageUrl: question.imageUrl ?? "",
        answers: question.answers.map((a) => ({
          id: a.id,
          text: a.text,
          isCorrect: a.isCorrect,
        })),
      }}
      onCancel={() => router.push(quizListHref)}
      onSubmit={handleSubmit}
      submitError={error}
      submitting={submitting}
      submitLabel="Зберегти зміни"
    />
  );
}
