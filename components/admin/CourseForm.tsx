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
  COURSE_CERTIFICATE_ALLOWED_MIME_TYPES,
  COURSE_CERTIFICATE_MAX_SIZE_BYTES,
  COURSE_CATEGORY_PRESETS,
} from "@/modules/courses";

export interface CourseFormValues {
  title: string;
  description: string;
  introTitle: string;
  introText: string;
  introHighlights: string[];
  trailerUrl: string;
  /** ФАЗА CAT+, задача CAT+.2.1 — обрані пресети й/або власні категорії курсу. */
  categories: string[];
  published: boolean;
  /** ФАЗА PAID+, задача PAID+.2.1 — `true`, якщо курс платний. */
  isPaid: boolean;
  /** ФАЗА PAID+, задача PAID+.2.2 — ціна в гривнях; порожній рядок, доки `isPaid === false`. */
  priceUAH: string;
}

export interface CourseFormProps {
  /**
   * `coverImage` — URL уже завантаженої обкладинки (для редагування), окремо
   * від решти текстових полів. `certificateImage` — той самий принцип
   * (CERTTPL+.0.2) для макета сертифіката курсу.
   */
  initial?: Partial<CourseFormValues> & {
    coverImage?: string | null;
    certificateImage?: string | null;
  };
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
  categories: [],
  published: false,
  isPaid: false,
  priceUAH: "",
};

const COVER_ERROR_MESSAGES = {
  maxSizeErrorMessage: "Розмір файлу перевищує 5MB",
  formatErrorMessage: "Дозволені лише зображення у форматі JPG, PNG або WebP",
};

/** CERTTPL+.0.2 — той самий підхід, що `COVER_ERROR_MESSAGES` вище, лише інший ліміт розміру (10MB, як у макета сертифіката). */
const CERTIFICATE_ERROR_MESSAGES = {
  maxSizeErrorMessage: "Розмір файлу перевищує 10MB",
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
 *
 * ФАЗА CERTTPL+ (30.08.2026, за прямим проханням користувача — "зроби
 * щоб в адмінці після створення курсу можна було додавати завантажити
 * зображення сертифікату(але якщо не додати то додасться стандартний
 * макет сертифікату")): додано окремий, повністю опційний блок "Макет
 * сертифіката" — той самий файловий аплоад-патерн, що "Обкладинка
 * курсу" вище (окремий стан прев'ю/файлу/прапорця видалення, окреме
 * поле `certificateImage`/`removeCertificateImage` у `FormData`), лише
 * інший ліміт розміру (10MB, `COURSE_CERTIFICATE_MAX_SIZE_BYTES`) і
 * своя допоміжна фраза в порожньому стані. Якщо адмін нічого не
 * завантажує — поле лишається `NULL`, і `CertificateCard`/
 * `CertificateThumbnail` (`components/certificates/`) і далі малюють
 * поточний намальований SVG-"папір" (без змін у цій фазі); якщо
 * завантажує — САМЕ ЦЕ зображення рендериться замість нього для
 * КОЖНОГО системного сертифіката цього курсу (без персоналізації
 * іменем — це готовий макет, не шаблон для підстановки тексту, той
 * самий принцип, що вже для завантажених користувачами сертифікатів,
 * CERT+.1).
 *
 * ФАЗА CAT+ (01.09.2026, за прямим проханням користувача — "щоб при
 * створенні курсів можна було вказувати декілька категорій (нарощення,
 * зняття, чистка, опил, початковий рівень, середній рівень, просунутий
 * рівень, або свою власну категорію)"): новий блок "Категорії курсу" —
 * кнопки-тумблери для `COURSE_CATEGORY_PRESETS` (той самий готовий
 * набір, що дав користувач) плюс текстове поле "своя категорія" для
 * будь-якого довільного значення. Обидва варіанти зберігаються в
 * одному масиві `categories` (`Course.categories`, простий
 * Postgres `String[]`, той самий підхід, що вже `introHighlights`
 * вище) — на рівні даних різниці немає.
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
  const [errors, setErrors] = useState<
    Partial<Record<"title" | "description" | "priceUAH", string>>
  >({});

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

  // CERTTPL+.0.2 — той самий набір стану, що для обкладинки вище, лише для
  // макета сертифіката курсу (окремий, повністю незалежний блок форми).
  const [certificatePreview, setCertificatePreview] = useState<string | null>(
    initial?.certificateImage ?? null,
  );
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateRemoved, setCertificateRemoved] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);

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

  /**
   * ФАЗА CAT+, задача CAT+.2.1 (01.09.2026). Категорії курсу — пресети
   * (`COURSE_CATEGORY_PRESETS`) поводяться як кнопки-тумблери (клік
   * додає/прибирає з `values.categories`), а `customCategoryInput` —
   * окреме текстове поле для власної довільної категорії з прямого
   * прохання користувача ("або свою власну категорію"). Обидва варіанти
   * зберігаються в ОДНОМУ масиві `values.categories` — на рівні даних
   * різниці немає, лише UI розрізняє "готовий пресет" від "щойно
   * вписаного тексту".
   */
  const [customCategoryInput, setCustomCategoryInput] = useState("");

  function toggleCategory(category: string) {
    setValues((prev) => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category],
    }));
  }

  function addCustomCategory() {
    const trimmed = customCategoryInput.trim();
    if (!trimmed || values.categories.includes(trimmed)) {
      setCustomCategoryInput("");
      return;
    }
    setValues((prev) => ({ ...prev, categories: [...prev.categories, trimmed] }));
    setCustomCategoryInput("");
  }

  function removeCategory(category: string) {
    setValues((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c !== category),
    }));
  }

  // Власні категорії — ті обрані, що НЕ входять у готовий набір
  // пресетів (для окремого блоку "видаляти хрестиком" нижче; пресети й
  // так знімаються повторним кліком на ту саму кнопку-тумблер).
  const customCategories = values.categories.filter(
    (c) => !(COURSE_CATEGORY_PRESETS as readonly string[]).includes(c),
  );

  function validate(): boolean {
    const nextErrors: typeof errors = {};
    if (values.title.trim().length < 3) {
      nextErrors.title = "Назва курсу має містити мінімум 3 символи";
    }
    if (values.description.trim().length < 10) {
      nextErrors.description = "Опис курсу має містити мінімум 10 символів";
    }
    // ФАЗА PAID+, задача PAID+.2.3 — ціна обов'язкова і > 0 лише коли
    // перемикач "Платний курс" увімкнено, той самий умовний принцип,
    // що вже на сервері (`modules/courses/schema.ts::requirePriceWhenPaid`).
    if (values.isPaid) {
      const price = Number(values.priceUAH);
      if (!values.priceUAH.trim() || !Number.isFinite(price) || price <= 0) {
        nextErrors.priceUAH = "Вкажіть ціну курсу в гривнях";
      }
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

  // CERTTPL+.0.2 — той самий підхід, що `handleCoverFileChange`/
  // `handleCoverRemove` вище, лише для макета сертифіката.
  function handleCertificateFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateFileBeforeUpload(file, {
      maxSizeBytes: COURSE_CERTIFICATE_MAX_SIZE_BYTES,
      allowedMimeTypes: COURSE_CERTIFICATE_ALLOWED_MIME_TYPES,
      ...CERTIFICATE_ERROR_MESSAGES,
    });
    if (validationError) {
      setCertificateError(validationError);
      return;
    }

    setCertificateError(null);
    setCertificateRemoved(false);
    setCertificateFile(file);
    setCertificatePreview(URL.createObjectURL(file));
  }

  function handleCertificateRemove() {
    setCertificateError(null);
    setCertificateFile(null);
    setCertificateRemoved(true);
    setCertificatePreview(null);
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
    values.categories
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .forEach((item) => formData.append("categories", item));
    formData.append("published", String(values.published));
    // ФАЗА PAID+, задача PAID+.2.1/2.3 (02.09.2026) — той самий підхід,
    // що `published` щойно вище. `priceUAH` надсилається лише коли
    // `isPaid: true` (порожній рядок для безкоштовного курсу трактується
    // сервером як `null`, `readCourseFormFields` в `actions.ts`).
    formData.append("isPaid", String(values.isPaid));
    if (values.isPaid) {
      formData.append("priceUAH", values.priceUAH.trim());
    }

    if (coverFile) {
      formData.append("coverImage", coverFile);
    } else if (coverRemoved) {
      formData.append("removeCoverImage", "true");
    }

    // CERTTPL+.0.2 — той самий підхід, що обкладинка вище.
    if (certificateFile) {
      formData.append("certificateImage", certificateFile);
    } else if (certificateRemoved) {
      formData.append("removeCertificateImage", "true");
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
          Пункти-переваги в секції &quot;Про курс&quot;
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

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-ink">Категорії курсу</label>
        <div className="flex flex-wrap gap-2">
          {COURSE_CATEGORY_PRESETS.map((category) => {
            const active = values.categories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent bg-accent-soft text-accent-dark"
                    : "border-rose-line/60 bg-white text-muted hover:border-accent"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Своя категорія (напр. Дизайн нігтів)"
              value={customCategoryInput}
              onChange={(e) => setCustomCategoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomCategory();
                }
              }}
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCustomCategory}>
            + Додати
          </Button>
        </div>
        {customCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customCategories.map((category) => (
              <span
                key={category}
                className="flex items-center gap-1.5 rounded-full bg-cream-soft px-3 py-1.5 text-sm text-ink"
              >
                {category}
                <button
                  type="button"
                  onClick={() => removeCategory(category)}
                  aria-label={`Прибрати категорію ${category}`}
                  className="text-muted hover:text-danger"
                >
                  <CloseIcon size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
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

      {/* CERTTPL+.0.2 — той самий блок-патерн, що "Обкладинка курсу" вище, повністю опційний. */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Макет сертифіката</label>
        {certificatePreview ? (
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={certificatePreview}
              alt=""
              className="h-48 w-full object-contain bg-cream-soft/40"
            />
            <button
              type="button"
              onClick={handleCertificateRemove}
              aria-label="Прибрати макет сертифіката"
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
                onChange={handleCertificateFileChange}
              />
            </label>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-rose-line/60 bg-cream-soft/40 px-6 py-8 text-center transition-colors hover:border-accent">
            <UploadIcon size={20} className="text-accent-dark" />
            <p className="text-sm text-ink">Перетягніть файл або натисніть, щоб завантажити</p>
            <p className="text-xs text-muted">JPG, PNG або WebP, максимум 10MB.</p>
            <p className="text-xs text-muted">
              Якщо не завантажити — використається стандартний макет сертифіката з назвою курсу.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCertificateFileChange}
            />
          </label>
        )}
        {certificateError && <p className="text-sm text-danger">{certificateError}</p>}
      </div>

      {/* ФАЗА PAID+, задача PAID+.2.1–2.4 (02.09.2026, за прямим
          проханням користувача — "щоб при створенні чи редагуванні
          курсу можна було вибирати безкоштовний чи платний курс"). Той
          самий блок-патерн (Switch + підпис), що "Опубліковано" нижче. */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-rose-line/50 bg-cream-soft/30 px-4 py-3.5">
        <div className="flex items-center gap-3">
          <Switch
            checked={values.isPaid}
            onChange={(v) => {
              update("isPaid", v);
              // Вимкнення перемикача одразу чистить поле ціни в UI —
              // дзеркало того, що сервер робить із `priceUAH` при
              // збереженні (`modules/courses/service.ts`), щоб форма не
              // показувала стару ціну для щойно зробленого безкоштовним
              // курсу.
              if (!v) {
                update("priceUAH", "");
                setErrors((prev) => ({ ...prev, priceUAH: undefined }));
              }
            }}
            aria-label="Платний курс"
          />
          <span className="text-sm text-ink">Платний курс</span>
        </div>

        {values.isPaid && (
          <>
            <Input
              label="Ціна (грн)"
              type="number"
              min={1}
              step={1}
              placeholder="Напр. 1500"
              value={values.priceUAH}
              onChange={(e) => update("priceUAH", e.target.value)}
              error={errors.priceUAH}
            />
            <p className="text-xs text-muted">
              Платний курс буде недоступний студентам, доки не підключено оплату.
            </p>
          </>
        )}
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
