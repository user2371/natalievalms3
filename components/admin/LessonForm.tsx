"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { EditIcon } from "@/components/ui/icons";
import { isYoutubeUrl } from "@/lib/youtube";

export interface LessonFormValues {
  title: string;
  order: number;
  duration: string;
  videoProvider: string;
  videoUrl: string;
  articleText: string;
}

export interface LessonFormProps {
  initial?: Partial<LessonFormValues>;
  /** Посилання на конструктор квізу (задача 0.13.7) — тільки для вже збереженого уроку. */
  quizHref?: string;
  /** Посилання на редактор статті (задача 0.18) — тільки для вже збереженого уроку, той самий принцип, що й `quizHref`. */
  articleHref?: string;
  /** ФАЗА HW+, задача HW+.3.3 (28.08.2026) — посилання на редактор ДЗ, той самий принцип, що й `articleHref`. */
  homeworkHref?: string;
  /** ФАЗА HW+, HW+.3.3 — чи вже збережено опис ДЗ для цього уроку (визначає напис кнопки: "Додати"/"Редагувати"). */
  hasHomeworkAssignment?: boolean;
  onCancel: () => void;
  onSubmit: (values: LessonFormValues) => void;
  submitLabel?: string;
  /** Помилка від сервера (задача 8.2.3/8.2.6) — показується над кнопками. */
  submitError?: string | null;
  /** `true` під час виконання server action (задача 8.7.3, loading-стан). */
  submitting?: boolean;
}

const EMPTY: LessonFormValues = {
  title: "",
  order: 1,
  duration: "",
  videoProvider: "youtube",
  videoUrl: "",
  articleText: "",
};

const VIDEO_PROVIDER_OPTIONS = [{ value: "youtube", label: "YouTube" }];

/**
 * Форма створення/редагування уроку (задача 0.13.5, підключена до
 * реальних даних у 8.2.2/8.2.3), за мокапом `adminPanel.png`: назва,
 * порядок, тривалість (хв:сек), провайдер відео (`Select`, поки один
 * варіант — YouTube, `VideoProvider` enum з Фази 1 матиме заготовку
 * `CUSTOM` на майбутнє), Video ID/URL, кнопка "Перейти до квізу" (0.13.7)
 * і кнопка "Додати статтю"/"Редагувати статтю" (0.18) — обидві лише коли
 * є відповідний `Href`, тобто урок уже існує (для щойно створюваного
 * уроку спершу треба зберегти його самого).
 *
 * Зміни при підключенні до `modules/lessons` (Фаза 8.2):
 * - **Поле "Порядок" — тепер READ-ONLY.** `order` призначається сервером
 *   автоматично (нове — "останній + 1", `modules/lessons/service.ts`) і
 *   НЕ входить у `CreateLessonSchema`/`UpdateLessonSchema` узагалі — зміна
 *   порядку існуючих уроків це окрема дія `reorderLessons` (drag-and-drop
 *   у списку уроків, задача 8.2.4, за межами 8.2.2/8.2.3). Поле лишили
 *   видимим (не приховали) — щоб адмін бачив поточну позицію уроку,
 *   просто без можливості редагувати тут.
 * - **Задача 8.2.6 (валідація videoUrl):** базова клієнтська перевірка —
 *   поле не може бути порожнім (той самий мінімум, що й
 *   `CreateLessonSchema`); повна YouTube-перевірка (`isYoutubeUrl`) вже
 *   існує на СЕРВЕРІ (`modules/lessons/schema.ts`, Фаза 3) — помилку
 *   звідти показує `submitError`.
 */
export function LessonForm({
  initial,
  quizHref,
  articleHref,
  homeworkHref,
  hasHomeworkAssignment = false,
  onCancel,
  onSubmit,
  submitLabel = "Зберегти",
  submitError = null,
  submitting = false,
}: LessonFormProps) {
  const [values, setValues] = useState<LessonFormValues>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Partial<Record<"title" | "videoUrl", string>>>({});

  function update<K extends keyof LessonFormValues>(key: K, value: LessonFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors: typeof errors = {};
    if (values.title.trim().length < 3) {
      nextErrors.title = "Назва уроку має містити мінімум 3 символи";
    }
    if (values.videoUrl.trim().length === 0) {
      nextErrors.videoUrl = "Посилання на відео обов'язкове";
    } else if (values.videoProvider === "youtube" && !isYoutubeUrl(values.videoUrl)) {
      nextErrors.videoUrl = "Некоректне посилання на YouTube-відео";
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
        label="Назва уроку"
        placeholder="Введіть назву уроку"
        value={values.title}
        onChange={(e) => update("title", e.target.value)}
        error={errors.title}
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label="Порядок"
          type="number"
          min={1}
          value={values.order}
          disabled
          readOnly
        />
        <p className="text-xs text-muted">
          Змінюється в списку уроків (стрілки вгору/вниз), не тут
        </p>
      </div>

      <Input
        label="Тривалість (хв:сек)"
        placeholder="05:00"
        value={values.duration}
        onChange={(e) => update("duration", e.target.value)}
      />

      <Select
        label="Відео провайдер"
        options={VIDEO_PROVIDER_OPTIONS}
        value={values.videoProvider}
        onChange={(e) => update("videoProvider", e.target.value)}
      />

      <Input
        label="Video ID / URL"
        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        value={values.videoUrl}
        onChange={(e) => update("videoUrl", e.target.value)}
        error={errors.videoUrl}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Стаття до уроку</label>
        {articleHref ? (
          <div>
            <Link href={articleHref}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<EditIcon size={16} />}
                iconPosition="left"
              >
                {values.articleText ? "Редагувати статтю" : "Додати статтю"}
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Стаття буде доступна після збереження уроку.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Домашнє завдання до уроку</label>
        {homeworkHref ? (
          <div>
            <Link href={homeworkHref}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<EditIcon size={16} />}
                iconPosition="left"
              >
                {hasHomeworkAssignment ? "Редагувати ДЗ" : "Додати ДЗ"}
              </Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Домашнє завдання буде доступне після збереження уроку.
          </p>
        )}
      </div>

      {quizHref && (
        <div>
          <label className="text-sm font-medium text-ink">Перейти до квізу</label>
          <div className="mt-1.5">
            <Link href={quizHref}>
              <Button type="button" variant="outline" size="sm">
                Налаштувати квіз
              </Button>
            </Link>
          </div>
        </div>
      )}

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
