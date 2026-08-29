"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Switch } from "@/components/ui/Switch";
import { Button } from "@/components/ui/Button";
import { CloseIcon, UploadIcon } from "@/components/ui/icons";
import { RichTextPlaceholder } from "@/components/admin/RichTextPlaceholder";
import { validateFileBeforeUpload } from "@/lib/images/validateFileBeforeUpload";
import {
  COURSE_COVER_ALLOWED_MIME_TYPES,
  COURSE_COVER_MAX_SIZE_BYTES,
} from "@/modules/courses";

export interface CourseFormValues {
  title: string;
  description: string;
  introTitle: string;
  introText: string;
  introHighlights: string[];
  trailerUrl: string;
  published: boolean;
}

export interface CourseFormProps {
  /** `coverImage` — URL уже завантаженої обкладинки (для редагування), окремо від решти текстових полів. */
  initial?: Partial<CourseFormValues> & { coverImage?: string | null };
  onCancel: () => void;
  /** Готова `FormData` (текстові поля + опційний файл обкладинки/прапорець видалення) — форма сама збирає її з внутрішнього стану. */
  onSubmit: (formData: FormData) => void;
  submitLabel?: string;
  /** Помилка від сервера (задача 8.1.7 — валідація і на сервері) — показується над кнопками. */
  submitError?: string | null;
  /** `true` під час виконання server action — блокує кнопку "Зберегти" (задача 8.7.3, loading-стан). */
  submitting?: boolean;
}

const EMPTY: CourseFormValues = {
  title: "",
  description: "",
  introTitle: "",
  introText: "",
  introHighlights: [],
  trailerUrl: "",
  published: false,
};

const COVER_ERROR_MESSAGES = {
  maxSizeErrorMessage: "Розмір файлу перевищує 5MB",
  formatErrorMessage: "Дозволені лише зображення у форматі JPG, PNG або WebP",
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
 * - **Задача 8.1.7 (валідація на клієнті):** ті самі правила, що й у
 *   `CreateCourseSchema`/`UpdateCourseSchema` (`modules/courses/schema.ts`)
 *   — назва мінімум 3 символи, опис мінімум 10 символів. Серверна
 *   валідація вже існувала (Фаза 3) — тут лише дзеркало на клієнті для
 *   миттєвого фідбеку; `submitError` — коли форма технічно валідна на
 *   клієнті, але сервер усе одно відхилив (напр. мережева помилка).
 *
 * ОНОВЛЕНО (за прямим зверненням користувача — "Зроби щоб обкладинку для
 * курсу можна було загружати як файл з усіма тими самими правилами що і
 * для аватарки"): **"Обкладинка (URL зображення)" замінено на файловий
 * аплоад** — той самий підхід, що вже на `/settings` для фото профілю
 * (`AVATAR_MAX_SIZE_BYTES`/`AVATAR_ALLOWED_MIME_TYPES`,
 * `modules/account/schema.ts`): 5MB, лише JPG/PNG/WebP
 * (`COURSE_COVER_MAX_SIZE_BYTES`/`COURSE_COVER_ALLOWED_MIME_TYPES`,
 * `modules/courses/schema.ts` — окрема константа з тим самим значенням,
 * той самий принцип незалежності модулів, що вже в `CERTIFICATE_MAX_SIZE_BYTES`).
 * Раніше документована причина URL-поля (задача 8.1.6, "у проєкті немає
 * підключеного файлового сховища") уже НЕ актуальна — Cloudinary
 * підключено ще в Фазі 3+ для аватарок, `lib/storage/courseCoverStorage.ts`
 * лише переюзовує той самий Sharp-пайплайн (`processUploadedImage`).
 *
 * Форма НЕ передає `File` через `onSubmit(values)` — натомість сама
 * збирає `FormData` (текстові поля + файл/прапорець видалення) і передає
 * його в `onSubmit`, той самий підхід, що `modules/account/actions.ts::
 * updateAvatarAction` вимагає від `app/settings/page.tsx` (Server Actions
 * не серіалізують `File` як звичайний аргумент). Клієнтська перевірка
 * файлу ПЕРЕД відправкою — `validateFileBeforeUpload`
 * (`lib/images/validateFileBeforeUpload.ts`), та сама функція, що вже на
 * `/settings` — лише зручність, реальна перевірка на сервері
 * (`validateCourseCoverFile`, `modules/courses/service.ts`) лишається
 * єдиним джерелом істини.
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

  // Прев'ю обкладинки: URL вже завантаженого файлу (редагування) АБО
  // локальний `URL.createObjectURL` щойно вибраного файлу — той самий
  // принцип, що `avatarPreview` на `/settings`. `coverFile` — сам `File`
  // для відправки; `coverRemoved` — окремий прапорець (не просто
  // "coverPreview === null"), бо `null` тут означає і "нічого не обирали",
  // і "щойно прибрали" — без нього "Прибрати обкладинку" не мало б
  // видимого ефекту на існуючому курсі при збереженні.
  const [coverPreview, setCoverPreview] = useState<string | null>(
    initial?.coverImage ?? null,
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  function update<K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // Редактор пунктів-переваг секції "Про курс" (задача HOME+.4.1) — той
  // самий підхід додавання/видалення рядків, що вже в `QuestionForm.tsx`
  // для варіантів відповіді квізу.
  function updateHighlight(index: number, value: string) {
    setValues((prev) => ({
      ...prev,
      introHighlights: prev.introHighlights.map((item, i) => (i === index ? value : item)),
    }));
  }

  function addHighlight() {
    setValues((prev) => ({ ...prev, introHighlights: [...prev.introHighlights, ""] }));
  }

  function removeHighlight(index: number) {
    setValues((prev) => ({
      ...prev,
      introHighlights: prev.introHighlights.filter((_, i) => i !== index),
    }));
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

  function handleCoverFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // дозволяє повторно вибрати той самий файл наступного разу
    if (!file) return;

    const validationError = validateFileBeforeUpload(file, {
      maxSizeBytes: COURSE_COVER_MAX_SIZE_BYTES,
      allowedMimeTypes: COURSE_COVER_ALLOWED_MIME_TYPES,
      ...COVER_ERROR_MESSAGES,
    });
    if (validationError) {
      setCoverError(validationError);
      return;
    }

    setCoverError(null);
    setCoverRemoved(false);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function handleCoverRemove() {
    setCoverError(null);
    setCoverFile(null);
    setCoverRemoved(true);
    setCoverPreview(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("introTitle", values.introTitle);
    formData.append("introVideoUrl", values.trailerUrl);
    formData.append("introDescription", values.introText);
    values.introHighlights
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .forEach((item) => formData.append("introHighlights", item));
    formData.append("published", String(values.published));

    if (coverFile) {
      formData.append("coverImage", coverFile);
    } else if (coverRemoved) {
      formData.append("removeCoverImage", "true");
    }

    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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

      <Input
        label='Заголовок секції "Про курс"'
        placeholder="Напр. Знайомство з курсом"
        value={values.introTitle}
        onChange={(e) => update("introTitle", e.target.value)}
      />

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

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink">
          Пункти-переваги в секції "Про курс"
        </label>
        {values.introHighlights.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="Напр. Анатомія нігтя та поширені захворювання"
                value={item}
                onChange={(e) => updateHighlight(index, e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => removeHighlight(index)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
              aria-label={`Прибрати пункт ${index + 1}`}
            >
              <CloseIcon size={14} />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addHighlight} className="self-start">
          + Додати пункт
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Обкладинка курсу</label>
        {coverPreview ? (
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="" className="h-48 w-full object-cover" />
            <button
              type="button"
              onClick={handleCoverRemove}
              aria-label="Прибрати обкладинку"
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white hover:bg-ink/80"
            >
              <CloseIcon size={14} />
            </button>
            <label className="absolute bottom-3 left-3 cursor-pointer rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-ink shadow-sm hover:bg-white">
              Замінити зображення
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleCoverFileChange}
              />
            </label>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-rose-line/60 bg-cream-soft/40 px-6 py-8 text-center transition-colors hover:border-accent">
            <UploadIcon size={20} className="text-accent-dark" />
            <p className="text-sm text-ink">Перетягніть файл або натисніть, щоб завантажити</p>
            <p className="text-xs text-muted">JPG, PNG або WebP, максимум 5MB.</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverFileChange}
            />
          </label>
        )}
        {coverError && <p className="text-sm text-danger">{coverError}</p>}
      </div>

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
