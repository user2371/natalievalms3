"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CourseForm, type CourseFormValues } from "@/components/admin/CourseForm";
import { updateCourseAction } from "@/modules/courses";
import type { Course } from "@/modules/courses";

/**
 * `components/admin/AdminEditCourseForm.tsx` (задача 8.1.3) — клієнтська
 * обгортка над `CourseForm`: отримує реальний `course` з серверної
 * сторінки (`app/admin/courses/[courseId]/edit/page.tsx`) як проп, на
 * `onSubmit` викликає `updateCourseAction`. Той самий поділ
 * "сервер вантажить дані, клієнт обробляє сабміт", що й
 * `AdminNewCoursePage`, лише з додатковим `initial`.
 */
export function AdminEditCourseForm({ course }: { course: Course }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: CourseFormValues) {
    setSubmitting(true);
    setError(null);

    const result = await updateCourseAction({
      id: course.id,
      title: values.title,
      description: values.description,
      coverImage: values.coverImage.trim() || null,
      published: values.published,
      introVideoUrl: values.trailerUrl.trim() || null,
      introDescription: values.introText.trim() || null,
    });

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
        introText: course.introDescription ?? "",
        trailerUrl: course.introVideoUrl ?? "",
        coverImage: course.coverImage ?? "",
        published: course.published,
      }}
      onCancel={() => router.push(`/admin/courses/${course.id}`)}
      onSubmit={handleSubmit}
      submitError={error}
      submitting={submitting}
    />
  );
}
