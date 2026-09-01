"use client";

import { useMemo } from "react";
import { generateHTML } from "@tiptap/html";
import { TIPTAP_EXTENSIONS } from "@/lib/tiptap/extensions";
import { useProseImageLightbox } from "@/lib/tiptap/useProseImageLightbox";
import { Modal } from "@/components/ui/Modal";
import { CloseIcon } from "@/components/ui/icons";

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
 *
 * ФАЗА FLOAT+, задача FLOAT+.5 (31.08.2026, прохання користувача): клік
 * на зображення в ДЗ відкриває його велику версію в модалці — той самий
 * `useProseImageLightbox`, що й `ArticleRenderer` (1:1 структура).
 */
export function HomeworkAssignmentRenderer({
  contentJson,
  className,
}: HomeworkAssignmentRendererProps) {
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

  if (!html) return null;

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
        labelledBy="homework-image-lightbox-title"
        variant="media"
      >
        <div className="mb-2 flex items-center justify-end">
          <h2 id="homework-image-lightbox-title" className="sr-only">
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
