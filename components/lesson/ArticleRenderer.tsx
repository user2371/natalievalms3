"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";

const EXTENSIONS = [StarterKit, TiptapLink, TiptapImage];

export interface ArticleRendererProps {
  /** Серіалізований JSON з `Article.contentJson`. */
  contentJson: string;
  className?: string;
}

/**
 * `components/lesson/ArticleRenderer.tsx` (задача 8.3.5 — "Попередній
 * перегляд статті через ArticleRenderer прямо в адмінці"). Читає-тільки:
 * `generateHTML(JSON.parse(contentJson), EXTENSIONS)` — той самий набір
 * розширень, що й у `TiptapEditor.tsx` (щоб перегляд справді відповідав
 * тому, що збережеться), рендериться як звичайний HTML (без другого
 * живого екземпляра редактора).
 *
 * Компонент навмисно лежить у `components/lesson/`, а не
 * `components/admin/` — це той самий рендерер, яким пізніше (окрема
 * майбутня задача, за межами 8.3.1–8.3.5) показуватиме статтю студентам
 * на `/courses/[slug]/lessons/[lessonId]` (`LessonArticleBlock`, зараз
 * усе ще на текстовій заглушці `DEFAULT_ARTICLE_TEXT`, не чіпали) — тож
 * розміщений одразу там, де логічно належить за призначенням, а не там,
 * де він ВИКОРИСТОВУЄТЬСЯ вперше.
 */
export function ArticleRenderer({ contentJson, className }: ArticleRendererProps) {
  const html = useMemo(() => {
    if (!contentJson.trim()) return "";
    try {
      const json = JSON.parse(contentJson);
      return generateHTML(json, EXTENSIONS);
    } catch {
      return "";
    }
  }, [contentJson]);

  if (!html) {
    return <p className="text-sm text-muted">Стаття поки порожня.</p>;
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
