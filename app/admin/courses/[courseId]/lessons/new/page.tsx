"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { LessonForm, type LessonFormValues } from "@/components/admin/LessonForm";
import { createLessonAction } from "@/modules/lessons";

/**
 * Створення уроку (задача 0.13.5 → 8.2.2, підключено до реальних даних):
 * `LessonForm.onSubmit` викликає `createLessonAction` (`modules/lessons`,
 * Фаза 3, `assertAdmin` усередині). `order` НЕ передається — призначається
 * сервером автоматично ("останній + 1"). `videoProvider` мапиться з
 * форми (`"youtube"`) у реальний enum (`"YOUTUBE"`).
 *
 * ⚠️ Назва курсу в breadcrumb — заглушка ("Курс") замість реального
 * `course.title`: цій сторінці не потрібні реальні дані КУРСУ (лише
 * `courseId` для створення уроку), а робити зайвий запит `getCourseByIdService`
 * тільки заради breadcrumb — за межами буквальної задачі 8.2.2. Список
 * уроків (8.2.1), куди веде breadcrumb, і сама сторінка уроку однаково
 * покажуть реальний курс.
 */
export default function AdminNewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: LessonFormValues) {
    setSubmitting(true);
    setError(null);

    const result = await createLessonAction({
      courseId,
      title: values.title,
      duration: values.duration.trim() || null,
      videoProvider: values.videoProvider === "youtube" ? "YOUTUBE" : "CUSTOM",
      videoUrl: values.videoUrl,
    });

    if (result.success) {
      router.push(`/admin/courses/${courseId}/lessons`);
    } else {
      setSubmitting(false);
      setError(result.error ?? "Не вдалося створити урок");
    }
  }

  return (
    <div>
      <AdminPageHeader
        title="Новий урок"
        breadcrumb={[
          { label: "Головна", href: "/admin/courses" },
          { label: "Курси", href: "/admin/courses" },
          { label: "Уроки", href: `/admin/courses/${courseId}/lessons` },
          { label: "Новий урок" },
        ]}
      />

      <div className="max-w-xl rounded-2xl border border-rose-line/40 bg-white p-6">
        <LessonForm
          onCancel={() => router.push(`/admin/courses/${courseId}/lessons`)}
          onSubmit={handleSubmit}
          submitError={error}
          submitting={submitting}
        />
      </div>
    </div>
  );
}
