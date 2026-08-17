"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { RichTextPlaceholder } from "@/components/admin/RichTextPlaceholder";

export interface CourseFormValues {
  title: string;
  description: string;
  introText: string;
  trailerUrl: string;
  coverImage: string;
  published: boolean;
}

export interface CourseFormProps {
  initial?: Partial<CourseFormValues>;
  onCancel: () => void;
  onSubmit: (values: CourseFormValues) => void;
  submitLabel?: string;
  /** Помилка від сервера (задача 8.1.7 — валідація і на сервері) — показується над кнопками. */
  submitError?: string | null;
  /** `true` під час виконання server action — блокує кнопку "Зберегти" (задача 8.7.3, loading-стан). */
  submitting?: boolean;
}

const EMPTY: CourseFormValues = {
  title: "",
  description: "",
  introText: "",
  trailerUrl: "",
  coverImage: "",
  published: false,
};

/**
 * Форма створення/редагування курсу (задача 0.13.3, підключена до реальних
 * даних у 8.1.2/8.1.3), за мокапом `adminPanel.png`.
 *
 * Зміни при підключенні до `modules/courses` (Фаза 8.1):
 * - **Поле "Slug" прибрано.** `slug` генерується автоматично на сервері з
 *   `title` (`modules/courses/service.ts`, `generateUniqueSlug`) — адмін
 *   його не вводить руками (той самий принцип, що задокументований у
 *   `modules/courses/schema.ts` ще з Фази 3).
 * - **Задача 8.1.6 (спосіб зберігання обкладинки — треба було визначити):
 *   URL-поле**, а не файл-аплоад. У проєкті немає підключеного файлового
 *   сховища (S3/Cloudinary/тощо), а `Course.coverImage` в Prisma-схемі —
 *   звичайний `String?` (URL). Реальний аплоад файлів — окрема майбутня
 *   задача (потребує вибору й підключення провайдера зберігання).
 * - **Задача 8.1.7 (валідація на клієнті):** ті самі правила, що й у
 *   `CreateCourseSchema`/`UpdateCourseSchema` (`modules/courses/schema.ts`)
 *   — назва мінімум 3 символи, опис мінімум 10 символів. Серверна
 *   валідація вже існувала (Фаза 3) — тут лише дзеркало на клієнті для
 *   миттєвого фідбеку; `submitError` — коли форма технічно валідна на
 *   клієнті, але сервер усе одно відхилив (напр. мережева помилка).
 */
export function CourseForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel = "Зберегти",
  submitError = null,
  submitting = false,
}: CourseFormProps) {
  const [values, setValues] = useState<CourseFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Partial<Record<"title" | "description", string>>>(
    {},
  );

  function update<K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: typeof errors = {};
    if (values.title.trim().length < 3) {
      nextErrors.title = "Назва курсу має містити мінімум 3 символи";
    }
    if (values.description.trim().length < 10) {
      nextErrors.description = "Опис курсу має містити мінімум 10 символів";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit(values);
      }}
      className="flex flex-col gap-5"
    >
      <Input
        label="Назва курсу"
        placeholder="Введіть назву"
        value={values.title}
        onChange={(e) => update("title", e.target.value)}
        error={errors.title}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Опис</label>
        <Textarea
          placeholder="Короткий опис курсу"
          rows={3}
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          error={errors.description}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Про курс (вступний текст)</label>
        <RichTextPlaceholder
          value={values.introText}
          onChange={(v) => update("introText", v)}
          placeholder='Детальний опис курсу, що буде у секції "Про курс"'
        />
      </div>

      <Input
        label="Трейлер (вступне відео)"
        placeholder="https://youtube.com/watch?v=example"
        value={values.trailerUrl}
        onChange={(e) => update("trailerUrl", e.target.value)}
      />

      <Input
        label="Обкладинка (URL зображення)"
        placeholder="https://images.example.com/cover.jpg"
        value={values.coverImage}
        onChange={(e) => update("coverImage", e.target.value)}
      />

      <div className="flex items-center gap-3">
        <Switch
          checked={values.published}
          onChange={(v) => update("published", v)}
          aria-label="Опубліковано"
        />
        <span className="text-sm text-ink">Опубліковано</span>
      </div>

      {submitError && <p className="text-sm text-danger">{submitError}</p>}

      <div className="flex justify-end gap-3 border-t border-rose-line/30 pt-5">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Скасувати
        </Button>
        <Button type="submit" disabled={submitting} loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
