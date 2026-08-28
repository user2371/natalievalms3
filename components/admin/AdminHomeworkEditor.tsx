"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TiptapEditor } from "@/components/admin/TiptapEditor";
import { HomeworkAssignmentRenderer } from "@/components/lesson/HomeworkAssignmentRenderer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EyeIcon, EditIcon, YoutubeIcon } from "@/components/ui/icons";
import { upsertHomeworkAssignmentAction, uploadHomeworkImageAction } from "@/modules/homeworkAssignments";

const EMPTY_DOC_JSON = JSON.stringify({ type: "doc", content: [{ type: "paragraph" }] });

/**
 * `components/admin/AdminHomeworkEditor.tsx` — ФАЗА HW+, задача HW+.3.1
 * (28.08.2026). 1:1 структура `AdminArticleEditor.tsx` (перемикач
 * Редагувати/Перегляд, явна кнопка "Зберегти" без автозбереження — той
 * самий вибір 8.3.4), ПЛЮС окреме поле під редактором — посилання на
 * відео-інструкцію (YouTube, той самий `YoutubeIcon`, що вже в
 * `RealHomeworkBlock.tsx`), необов'язкове.
 *
 * `TiptapEditor` тут отримує `onUploadImage` (HW+.2.1) — реальний аплоад
 * файлу через `uploadHomeworkImageAction`, а НЕ `window.prompt` за URL,
 * як досі в `AdminArticleEditor` (стаття свідомо НЕ чіпається в цій
 * фазі).
 */
export function AdminHomeworkEditor({
  lessonId,
  redirectHref,
  initialContentJson,
  initialVideoUrl,
}: {
  lessonId: string;
  redirectHref: string;
  initialContentJson: string | null;
  initialVideoUrl: string | null;
}) {
  const router = useRouter();
  const [contentJson, setContentJson] = useState(initialContentJson ?? EMPTY_DOC_JSON);
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl ?? "");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  async function handleUploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.set("lessonId", lessonId);
    formData.set("image", file);

    const result = await uploadHomeworkImageAction(formData);
    if (!result.success || !result.url) {
      throw new Error(result.error ?? "Не вдалося завантажити зображення");
    }
    return result.url;
  }

  async function handleSave() {
    setSubmitting(true);
    setError(null);

    const result = await upsertHomeworkAssignmentAction({
      lessonId,
      contentJson,
      videoUrl: videoUrl.trim() || null,
    });

    setSubmitting(false);
    if (result.success) {
      setSavedAt(new Date());
    } else {
      setError(result.error ?? "Не вдалося зберегти домашнє завдання");
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
        <TiptapEditor
          initialContentJson={contentJson}
          onChangeJson={setContentJson}
          onUploadImage={handleUploadImage}
        />
      ) : (
        <div className="min-h-[280px] rounded-xl border border-rose-line/40 bg-cream-soft/30 px-5 py-4">
          {contentJson.trim() && contentJson !== EMPTY_DOC_JSON ? (
            <HomeworkAssignmentRenderer contentJson={contentJson} />
          ) : (
            <p className="text-sm text-muted">Опис завдання поки порожній.</p>
          )}
        </div>
      )}

      <Input
        label="Посилання на відео-інструкцію (YouTube)"
        icon={<YoutubeIcon size={17} />}
        type="url"
        placeholder="https://youtu.be/…"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex justify-end gap-3 border-t border-rose-line/30 pt-5">
        <Button type="button" variant="ghost" onClick={() => router.push(redirectHref)}>
          Назад до уроку
        </Button>
        <Button type="button" onClick={handleSave} disabled={submitting} loading={submitting}>
          Зберегти домашнє завдання
        </Button>
      </div>
    </div>
  );
}
