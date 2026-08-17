"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { QuestionForm, type QuestionFormValues } from "@/components/admin/QuestionForm";
import { createQuestionAction } from "@/modules/quizzes";

/**
 * Створення питання квізу (задача 0.13.9 → 8.4.2, підключено до реальних
 * даних): `QuestionForm.onSubmit` викликає `createQuestionAction`
 * (`modules/quizzes`, Фаза 6, `assertAdmin` усередині). `type` мапиться з
 * форми (`"text"`/`"image"`, `AdminQuestionType`, лишили як є — форму не
 * чіпали) у реальний enum (`"TEXT"`/`"IMAGE"`). Відповіді — БЕЗ клієнтських
 * тимчасових `id` (`"new-answer-N"`, лише для React `key`/локального
 * стану форми) — `CreateAnswerSchema` приймає тільки `{ text, isCorrect }`.
 *
 * Динамічний список відповідей (додати/прибрати/переставити) у самій
 * `QuestionForm` уже був повністю робочим (задачі 6.20/6.24, клієнтський
 * стан) — підключення сюди `createQuestionAction` автоматично робить
 * ЦІЛУ форму (включно з відповідями) реальною, без додаткової окремої
 * "CRUD відповідей" (задача 8.4.4 в іншому сенсі — там про підключення
 * саме списку ІСНУЮЧИХ відповідей при РЕДАГУВАННІ, що поза межами цього
 * кроку, бо сторінка редагування питання не входила в 8.4.1/8.4.2
 * буквально).
 */
export default function AdminNewQuestionPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quizListHref = `/admin/courses/${courseId}/lessons/${lessonId}/quiz`;

  async function handleSubmit(values: QuestionFormValues) {
    setSubmitting(true);
    setError(null);

    const result = await createQuestionAction({
      lessonId,
      type: values.type === "image" ? "IMAGE" : "TEXT",
      text: values.text,
      imageUrl: values.type === "image" ? values.imageUrl.trim() || null : null,
      answers: values.answers.map((answer) => ({
        text: answer.text,
        isCorrect: answer.isCorrect,
      })),
    });

    if (result.success) {
      router.push(quizListHref);
    } else {
      setSubmitting(false);
      setError(result.error ?? "Не вдалося створити питання");
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Нове питання"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: "Квіз", href: quizListHref },
          { label: "Нове питання" },
        ]}
      />

      <div className="max-w-2xl rounded-2xl border border-rose-line/40 bg-white p-6">
        <QuestionForm
          onCancel={() => router.push(quizListHref)}
          onSubmit={handleSubmit}
          submitError={error}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
