"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import { TIPTAP_EXTENSIONS } from "@/lib/tiptap/extensions";
import { useProseImageLightbox } from "@/lib/tiptap/useProseImageLightbox";
import { Modal } from "@/components/ui/Modal";
import { CloseIcon } from "@/components/ui/icons";

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
 *
 * ФАЗА FLOAT+, задача FLOAT+.5 (31.08.2026, прохання користувача): клік
 * на зображення в статті відкриває його велику версію в модалці —
 * `useProseImageLightbox` (спільна логіка з `HomeworkAssignmentRenderer`).
 */
export function ArticleRenderer({ contentJson, className }: ArticleRendererProps) {
  const { lightboxImage, closeLightbox, handleContentClick } = useProseImageLightbox();

  const html = useMemo(() => {
    if (!contentJson.trim()) return "";
    try {
      const json = JSON.parse(contentJson);
      return generateHTML(json, TIPTAP_EXTENSIONS);
    } catch {
      return "";
    }
  }, [contentJson]);

  if (!html) {
    return <p className="text-sm text-muted">Стаття поки порожня.</p>;
  }

  return (
    <>
      <div
        className={`prose prose-sm max-w-none [&_img]:cursor-zoom-in ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={handleContentClick}
      />
      <Modal
        open={lightboxImage !== null}
        onClose={closeLightbox}
        labelledBy="article-image-lightbox-title"
        variant="media"
      >
        <div className="mb-2 flex items-center justify-end">
          <h2 id="article-image-lightbox-title" className="sr-only">
            {lightboxImage?.alt || "Зображення"}
          </h2>
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Закрити"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-soft/40 hover:text-ink"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        {lightboxImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lightboxImage.src}
            alt={lightboxImage.alt}
            className="max-h-[75vh] w-full rounded-xl object-contain"
          />
        )}
      </Modal>
    </>
  );
}
