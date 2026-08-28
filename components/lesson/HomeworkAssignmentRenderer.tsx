"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";

const EXTENSIONS = [StarterKit, TiptapLink, TiptapImage];

export interface HomeworkAssignmentRendererProps {
  /** Серіалізований JSON з `HomeworkAssignment.contentJson`. */
  contentJson: string;
  className?: string;
}

/**
 * `components/lesson/HomeworkAssignmentRenderer.tsx` — ФАЗА HW+, задача
 * HW+.4.1 (28.08.2026). Тонка read-only обгортка над тим самим
 * Tiptap-рендер-набором розширень, що `ArticleRenderer.tsx` (1:1
 * структура) — `generateHTML(JSON.parse(contentJson), EXTENSIONS)`, без
 * другого живого екземпляра редактора (`editable={false}` тут не
 * потрібен окремо: `generateHTML` не створює редагований інстанс
 * взагалі, той самий підхід, що вже в `ArticleRenderer`).
 */
export function HomeworkAssignmentRenderer({
  contentJson,
  className,
}: HomeworkAssignmentRendererProps) {
  const html = useMemo(() => {
    if (!contentJson.trim()) return "";
    try {
      const json = JSON.parse(contentJson);
      return generateHTML(json, EXTENSIONS);
    } catch {
      return "";
    }
  }, [contentJson]);

  if (!html) return null;

  return (
    <div
      className={`prose prose-sm max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
