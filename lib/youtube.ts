/**
 * Спільні утиліти для роботи з YouTube-посиланнями. Використовуються і при
 * валідації здачі відео ДЗ (`HomeworkBlock`), і при рендері зданих відео на
 * профілі (`HomeworkVideoCard`) через `VideoPlayer`.
 */

/** Чи схоже рядок на посилання на відео YouTube (watch/youtu.be/embed/shorts — усі формати, які розпізнає `extractYoutubeId`). */
export function isYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null;
}

/** Витягує id відео з посилання YouTube (watch/youtu.be/embed/shorts). `null`, якщо не вдалось розпізнати. */
export function extractYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split(/[/?&]/)[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      const match = parsed.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (match) return match[2];
    }

    return null;
  } catch {
    return null;
  }
}
