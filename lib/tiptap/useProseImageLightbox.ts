"use client";

import { useCallback, useState, type MouseEvent } from "react";

/**
 * ФАЗА FLOAT+, задача FLOAT+.5 (31.08.2026, прохання користувача: клік
 * на зображення в статті чи ДЗ відкриває його велику версію в
 * модалці). Спільна логіка для `ArticleRenderer.tsx` і
 * `HomeworkAssignmentRenderer.tsx` — обидва рендерять `contentJson`
 * через `generateHTML` + `dangerouslySetInnerHTML` (сирий HTML, не
 * React-дерево), тому індивідуальний `onClick` на кожен `<img>`
 * повісити не можна — замість цього один обробник кліку на
 * контейнер (делегування подій), який перевіряє, чи клікнутий елемент
 * — `IMG`, і якщо так, відкриває лайтбокс із його `src`/`alt`. Той
 * самий патерн модалки (`Modal` variant="media"), що вже в
 * `CertificateThumbnail.tsx` (CERT+.2.8).
 */
export function useProseImageLightbox() {
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

  const handleContentClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "IMG") return;
    const img = target as HTMLImageElement;
    setLightboxImage({ src: img.src, alt: img.alt || "" });
  }, []);

  return {
    lightboxImage,
    closeLightbox: () => setLightboxImage(null),
    handleContentClick,
  };
}
