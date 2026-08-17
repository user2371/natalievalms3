"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CourseForm, type CourseFormValues } from "@/components/admin/CourseForm";
import { createCourseAction } from "@/modules/courses";

/**
 * Створення курсу (задача 0.13.3 → 8.1.2, підключено до реальних даних):
 * `CourseForm.onSubmit` викликає `createCourseAction` (`modules/courses`,
 * Фаза 3, `assertAdmin` усередині — задача 8.7.1 вже покрита звідти),
 * при успіху — редірект на список курсів, при помилці — текст під формою
 * (`CourseForm.submitError`), кнопка блокується на час запиту
 * (`submitting`, задача 8.7.3).
 */
export default function AdminNewCoursePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: CourseFormValues) {
    setSubmitting(true);
    setError(null);

    const result = await createCourseAction({
      title: values.title,
      description: values.description,
      coverImage: values.coverImage.trim() || null,
      published: values.published,
      introVideoUrl: values.trailerUrl.trim() || null,
      introDescription: values.introText.trim() || null,
    });

    if (result.success) {
      router.push("/admin/courses");
    } else {
      setSubmitting(false);
      setError(result.error ?? "Не вдалося створити курс");
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Новий курс"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: "Новий курс" },
        ]}
      />

      <div className="max-w-xl rounded-2xl border border-rose-line/40 bg-white p-6">
        <CourseForm
          onCancel={() => router.push("/admin/courses")}
          onSubmit={handleSubmit}
          submitError={error}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
