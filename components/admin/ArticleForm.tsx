"use client";

import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { CloseIcon, UploadIcon } from "@/components/ui/icons";
import { ADMIN_ARTICLE_CATEGORIES } from "@/lib/data/admin";

export interface ArticleFormValues {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  content: string;
  status: "draft" | "published";
  visibility: "public" | "private";
  publishDate: string;
  publishTime: string;
  categoryIds: string[];
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  allowComments: boolean;
  showInList: boolean;
  notifySubscribers: boolean;
}

export interface ArticleFormProps {
  initial?: Partial<ArticleFormValues>;
  onCancel: () => void;
  onSaveDraft: (values: ArticleFormValues) => void;
  onPublish: (values: ArticleFormValues) => void;
}

const EMPTY: ArticleFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  coverImageUrl: null,
  content: "",
  status: "draft",
  visibility: "public",
  publishDate: "",
  publishTime: "",
  categoryIds: [],
  tags: [],
  metaTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  allowComments: true,
  showInList: true,
  notifySubscribers: false,
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Чернетка" },
  { value: "published", label: "Опубліковано" },
];

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Публічна" },
  { value: "private", label: "Приватна" },
];

const TOOLBAR_GROUPS: string[][] = [
  ["B", "I", "U", "S"],
  ["•", "1."],
  ["≡", "≣"],
  ["🔗", "🖼", "❝"],
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Редактор статті (задача 0.18), за мокапом `AdminArticle.png`: повноцінна
 * сторінка (не форма в модалці/картці, як `LessonForm`/`CourseForm`) —
 * заголовок/slug/короткий опис/обкладинка/зміст статті в основній колонці,
 * і бічна панель "Публікація"/"Категорії"/"Теги"/"SEO"/"Додатково" праворуч.
 *
 * Так само, як `RichTextPlaceholder` (задача 0.13.6): "Зміст статті" —
 * декоративний тулбар (тепер ширший — параграф-селектор, B/I/U/S, списки,
 * вирівнювання, посилання/зображення/цитата) + звичайна `<textarea>`, без
 * реальної WYSIWYG-логіки. Реальна інтеграція Tiptap — задача 8.3.1+, тоді
 * і "Зображення обкладинки"/тег-інпут/чекбокси отримають справжнє
 * збереження (`modules/articles`, Фаза 3+).
 *
 * "Зберегти чернетку" і "Опублікувати" — два окремі колбеки (а не один
 * `onSubmit`, як в інших формах адмінки), бо в мокапі це різні дії з
 * різним результуючим `status`, а не варіанти тексту однієї кнопки.
 * У мокапі ці кнопки (разом зі "Скасувати") — у верхній панелі поруч із
 * заголовком; тут вони внизу форми, як в `LessonForm`/`CourseForm`/
 * `QuestionForm` — єдиний патерн дій форми в усій адмінці важливіший за
 * точну позицію з одного конкретного мокапу.
 */
export function ArticleForm({
  initial,
  onCancel,
  onSaveDraft,
  onPublish,
}: ArticleFormProps) {
  const [values, setValues] = useState<ArticleFormValues>({ ...EMPTY, ...initial });
  const [tagInput, setTagInput] = useState("");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  function update<K extends keyof ArticleFormValues>(
    key: K,
    value: ArticleFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleTitleChange(title: string) {
    setValues((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  }

  function regenerateSlug() {
    setSlugTouched(false);
    update("slug", slugify(values.title));
  }

  function toggleCategory(id: string) {
    setValues((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  }

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag || values.tags.includes(tag)) return;
    update("tags", [...values.tags, tag]);
    setTagInput("");
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
  }

  const wordCount = values.content.trim() ? values.content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Основна колонка */}
      <div className="flex flex-1 flex-col gap-5 rounded-2xl border border-rose-line/40 bg-white p-6">
        <Input
          label="Заголовок статті *"
          placeholder="Введіть заголовок статті"
          maxLength={120}
          value={values.title}
          onChange={(e) => handleTitleChange(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Slug (URL)</label>
          <div className="flex items-center gap-2 rounded-xl border border-rose-line/60 bg-white px-4 py-3 focus-within:border-accent">
            <input
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", e.target.value);
              }}
              placeholder="yak-pravylno-pidgotuvaty"
              className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            <button
              type="button"
              onClick={regenerateSlug}
              className="shrink-0 text-xs font-medium text-accent-dark hover:underline"
            >
              Автогенерація
            </button>
          </div>
          {values.slug && (
            <p className="truncate text-xs text-muted">
              https://natalieva.com/blog/{values.slug}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Короткий опис</label>
          <Textarea
            placeholder="Короткий опис статті для прев'ю та карток"
            rows={3}
            maxLength={160}
            value={values.excerpt}
            onChange={(e) => update("excerpt", e.target.value)}
          />
          <p className="text-right text-xs text-muted">{values.excerpt.length}/160</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Зображення обкладинки</label>
          {values.coverImageUrl ? (
            <div className="relative overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={values.coverImageUrl}
                alt=""
                className="h-48 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => update("coverImageUrl", null)}
                aria-label="Прибрати зображення"
                className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink/60 text-white hover:bg-ink/80"
              >
                <CloseIcon size={14} />
              </button>
              <button
                type="button"
                className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-medium text-ink shadow-sm hover:bg-white"
              >
                Замінити зображення
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-rose-line/60 bg-cream-soft/40 px-6 py-8 text-center">
              <UploadIcon size={20} className="text-accent-dark" />
              <p className="text-sm text-ink">Перетягніть файл або завантажте</p>
              <p className="text-xs text-muted">
                Рекомендований розмір: 1200×675px. JPG, PNG або WebP. Макс. 2MB.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Зміст статті</label>
          <div className="overflow-hidden rounded-xl border border-rose-line/60 bg-white focus-within:border-accent">
            <div className="flex flex-wrap items-center gap-2 border-b border-rose-line/40 bg-cream-soft/50 px-2 py-1.5">
              <span
                aria-hidden
                className="flex h-7 items-center rounded-lg px-2 text-xs text-muted"
              >
                Параграф ▾
              </span>
              {TOOLBAR_GROUPS.map((group, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 border-l border-rose-line/40 pl-2 first:border-l-0 first:pl-0"
                >
                  {group.map((btn) => (
                    <span
                      key={btn}
                      aria-hidden
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-sm text-muted"
                    >
                      {btn}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            <textarea
              value={values.content}
              onChange={(e) => update("content", e.target.value)}
              placeholder="Текст статті"
              rows={12}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-rose-line/30 px-4 py-2 text-xs text-muted">
              <span>Кількість слів: {wordCount}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-rose-line/30 pt-5">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Скасувати
          </Button>
          <Button type="button" variant="outline" onClick={() => onSaveDraft(values)}>
            Зберегти чернетку
          </Button>
          <Button type="button" onClick={() => onPublish(values)}>
            Опублікувати
          </Button>
        </div>
      </div>

      {/* Бічна панель */}
      <div className="flex w-full flex-col gap-5 lg:w-80 lg:shrink-0">
        <div className="flex flex-col gap-4 rounded-2xl border border-rose-line/40 bg-white p-5">
          <p className="text-xs font-semibold tracking-[0.15em] text-accent-dark uppercase">
            Публікація
          </p>

          <Select
            label="Статус"
            options={STATUS_OPTIONS}
            value={values.status}
            onChange={(e) =>
              update("status", e.target.value as ArticleFormValues["status"])
            }
          />

          <Select
            label="Видимість"
            options={VISIBILITY_OPTIONS}
            value={values.visibility}
            onChange={(e) =>
              update("visibility", e.target.value as ArticleFormValues["visibility"])
            }
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Опублікувати"
              type="date"
              value={values.publishDate}
              onChange={(e) => update("publishDate", e.target.value)}
            />
            <Input
              label="Час"
              type="time"
              value={values.publishTime}
              onChange={(e) => update("publishTime", e.target.value)}
            />
          </div>

          <Button type="button" className="w-full" onClick={() => onPublish(values)}>
            Опублікувати зараз
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-rose-line/40 bg-white p-5">
          <p className="text-xs font-semibold tracking-[0.15em] text-accent-dark uppercase">
            Категорії
          </p>
          {ADMIN_ARTICLE_CATEGORIES.map((category) => (
            <Checkbox
              key={category.id}
              label={category.label}
              checked={values.categoryIds.includes(category.id)}
              onChange={() => toggleCategory(category.id)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-rose-line/40 bg-white p-5">
          <p className="text-xs font-semibold tracking-[0.15em] text-accent-dark uppercase">
            Теги
          </p>
          <div className="flex flex-wrap gap-2">
            {values.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-dark"
              >
                {tag}
                <button
                  type="button"
                  onClick={() =>
                    update(
                      "tags",
                      values.tags.filter((t) => t !== tag),
                    )
                  }
                  aria-label={`Прибрати тег ${tag}`}
                  className="hover:text-danger"
                >
                  <CloseIcon size={11} />
                </button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Додати тег..."
            className="w-full rounded-xl border border-rose-line/60 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <p className="text-xs text-muted">Натисніть Enter для додавання</p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-rose-line/40 bg-white p-5">
          <p className="text-xs font-semibold tracking-[0.15em] text-accent-dark uppercase">
            SEO налаштування
          </p>

          <div className="flex flex-col gap-1.5">
            <Input
              label="Meta title"
              maxLength={60}
              value={values.metaTitle}
              onChange={(e) => update("metaTitle", e.target.value)}
            />
            <p className="text-right text-xs text-muted">{values.metaTitle.length}/60</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Meta description</label>
            <Textarea
              rows={3}
              maxLength={160}
              value={values.metaDescription}
              onChange={(e) => update("metaDescription", e.target.value)}
            />
            <p className="text-right text-xs text-muted">
              {values.metaDescription.length}/160
            </p>
          </div>

          <Input
            label="Canonical URL"
            value={values.canonicalUrl}
            onChange={(e) => update("canonicalUrl", e.target.value)}
            placeholder={`https://natalieva.com/blog/${values.slug || "..."}`}
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-rose-line/40 bg-white p-5">
          <p className="text-xs font-semibold tracking-[0.15em] text-accent-dark uppercase">
            Додатково
          </p>
          <Checkbox
            label="Дозволити коментарі"
            checked={values.allowComments}
            onChange={(e) => update("allowComments", e.target.checked)}
          />
          <Checkbox
            label="Показати в списку статей"
            checked={values.showInList}
            onChange={(e) => update("showInList", e.target.checked)}
          />
          <Checkbox
            label="Надіслати сповіщення підписникам"
            checked={values.notifySubscribers}
            onChange={(e) => update("notifySubscribers", e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}
