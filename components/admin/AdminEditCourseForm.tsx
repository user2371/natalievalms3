"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseForm } from "@/components/admin/CourseForm";
import { updateCourseAction } from "@/modules/courses";
import type { Course } from "@/modules/courses";

/**
 * `components/admin/AdminEditCourseForm.tsx` (задача 8.1.3) — клієнтська
 * обгортка над `CourseForm`: отримує реальний `course` з серверної
 * сторінки (`app/admin/courses/[courseId]/edit/page.tsx`) як проп, на
 * `onSubmit` викликає `updateCourseAction`. Той самий поділ
 * "сервер вантажить дані, клієнт обробляє сабміт", що й
 * `AdminNewCoursePage`, лише з додатковим `initial`.
 *
 * ОНОВЛЕНО (обкладинка курсу тепер файловий аплоад, не URL — див.
 * `CourseForm.tsx`): `CourseForm.onSubmit` тепер віддає готову
 * `FormData` (текстові поля + опційний файл/прапорець видалення),
 * сюди лише додається `id` курсу (єдине поле, якого немає всередині
 * самої форми) перед відправкою в `updateCourseAction`
 * (`modules/courses/actions.ts`).
 */
export function AdminEditCourseForm({ course }: { course: Course }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);

    formData.append("id", course.id);
    const result = await updateCourseAction(formData);

    if (result.success) {
      router.push(`/admin/courses/${course.id}`);
    } else {
      setSubmitting(false);
      setError(result.error ?? "Не вдалося оновити курс");
    }
  }

  return (
    <CourseForm
      initial={{
        title: course.title,
        description: course.description,
        introTitle: course.introTitle ?? "",
        introText: course.introDescription ?? "",
        introHighlights: course.introHighlights ?? [],
        trailerUrl: course.introVideoUrl ?? "",
        published: course.published,
        coverImage: course.coverImage ?? undefined,
      }}
      onCancel={() => router.push(`/admin/courses/${course.id}`)}
      onSubmit={handleSubmit}
      submitError={error}
      submitting={submitting}
    />
  );
}
