"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { ArticleRenderer } from "@/components/lesson/ArticleRenderer";
import { Button } from "@/components/ui/Button";
import { EyeIcon, EditIcon } from "@/components/ui/icons";
import { upsertArticleAction } from "@/modules/articles";

const EMPTY_DOC_JSON = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

/**
 * `components/admin/AdminArticleEditor.tsx` — обгортка над `TiptapEditor`
 * для сторінки `/admin/courses/[courseId]/lessons/[lessonId]/article`.
 *
 * - **8.3.3**: "Зберегти статтю" викликає `upsertArticleAction({ lessonId,
 *   contentJson })` — реальний upsert по `lessonId`.
 * - **8.3.4** ("автозбереження (debounce) або явна кнопка — визначити
 *   підхід"): **рішення — явна кнопка**, не автозбереження. Debounce
 *   означав би періодичні server-запити навіть під час активного набору
 *   тексту й непередбачувані "проміжні" стани збереження — для
 *   MVP-редактора однієї статті явна кнопка простіша, передбачуваніша й
 *   не має проблем із гонками запитів; той самий вибір (не debounce), що
 *   й у `CourseForm`/`LessonForm` (звичайний сабміт, не автозбереження).
 * - **8.3.5**: перемикач "Редагувати"/"Перегляд" — `ArticleRenderer`
 *   (той самий набір Tiptap-розширень, що й сам редактор) показує, як
 *   стаття виглядатиме для студента.
 */
export function AdminArticleEditor({
  lessonId,
  redirectHref,
  initialContentJson,
}: {
  lessonId: string;
  redirectHref: string;
  initialContentJson: string | null;
}) {
  const router = useRouter();
  const [contentJson, setContentJson] = useState(initialContentJson ?? EMPTY_DOC_JSON);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function handleSave() {
    setSubmitting(true);
    setError(null);

    const result = await upsertArticleAction({ lessonId, contentJson });

    setSubmitting(false);
    if (result.success) {
      setSavedAt(new Date());
    } else {
      setError(result.error ?? "Не вдалося зберегти статтю");
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-rose-line/40 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-cream-soft p-1">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "edit" ? "bg-white text-ink shadow-sm" : "text-muted"
            }`}
          >
            <EditIcon size={14} />
            Редагувати
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "preview" ? "bg-white text-ink shadow-sm" : "text-muted"
            }`}
          >
            <EyeIcon size={14} />
            Перегляд
          </button>
        </div>
        {savedAt && (
          <p className="text-xs text-muted">
            Збережено о {savedAt.toLocaleTimeString("uk-UA")}
          </p>
        )}
      </div>

      {mode === "edit" ? (
        <TiptapEditor initialContentJson={contentJson} onChangeJson={setContentJson} />
      ) : (
        <div className="min-h-[280px] rounded-xl border border-rose-line/40 bg-cream-soft/30 px-5 py-4">
          <ArticleRenderer contentJson={contentJson} />
        </div>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-rose-line/30 pt-5">
        <Button type="button" variant="ghost" onClick={() => router.push(redirectHref)}>
          Назад до уроку
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          loading={submitting}
        >
          Зберегти статтю
        </Button>
      </div>
    </div>
  );
}
