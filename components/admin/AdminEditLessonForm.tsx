"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LessonForm, type LessonFormValues } from "@/components/admin/LessonForm";
import { updateLessonAction } from "@/modules/lessons";
import type { Lesson } from "@/modules/lessons";

/**
 * `components/admin/AdminEditLessonForm.tsx` (задача 8.2.3) — клієнтська
 * обгортка над `LessonForm`: отримує реальний `lesson` з серверної
 * сторінки як проп, на `onSubmit` викликає `updateLessonAction`.
 * `videoProvider` мапиться між формою (`"youtube"`) і реальним enum
 * (`"YOUTUBE"`/`"CUSTOM"`) в обидва боки. `order` НЕ передається в
 * `updateLessonAction` — той самий принцип, що й у `LessonForm.tsx`
 * (`UpdateLessonSchema` його взагалі не приймає, зміна порядку — задача
 * 8.2.4).
 */
export function AdminEditLessonForm({
  lesson,
  quizHref,
  articleHref,
  homeworkHref,
  hasHomeworkAssignment,
}: {
  lesson: Lesson;
  quizHref: string;
  articleHref: string;
  /** ФАЗА HW+, задача HW+.3.3 — той самий принцип, що й `articleHref`. */
  homeworkHref: string;
  hasHomeworkAssignment: boolean;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: LessonFormValues) {
    setSubmitting(true);
    setError(null);

    const result = await updateLessonAction({
      id: lesson.id,
      title: values.title,
      duration: values.duration.trim() || null,
      videoProvider: values.videoProvider === "youtube" ? "YOUTUBE" : "CUSTOM",
      videoUrl: values.videoUrl,
    });

    if (result.success) {
      router.push(`/admin/courses/${lesson.courseId}/lessons`);
    } else {
      setSubmitting(false);
      setError(result.error ?? "Не вдалося оновити урок");
    }
  }

  return (
    <LessonForm
      initial={{
        title: lesson.title,
        order: lesson.order,
        duration: lesson.duration ?? "",
        videoProvider: lesson.videoProvider === "YOUTUBE" ? "youtube" : "custom",
        videoUrl: lesson.videoUrl,
      }}
      quizHref={quizHref}
      articleHref={articleHref}
      homeworkHref={homeworkHref}
      hasHomeworkAssignment={hasHomeworkAssignment}
      onCancel={() => router.push(`/admin/courses/${lesson.courseId}/lessons`)}
      onSubmit={handleSubmit}
      submitError={error}
      submitting={submitting}
    />
  );
}
