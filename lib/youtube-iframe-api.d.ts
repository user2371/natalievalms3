// Мінімальні типи для YouTube IFrame Player API (задачі 4.1–4.3) — офіційних
// `@types/youtube` немає серед залежностей, а повний пакет типів значно
// ширший за те, що реально використовує `YoutubePlayer.tsx`. Опис тільки
// того, що реально викликається: конструктор `YT.Player`, стани відтворення
// й колбеки `onReady`/`onStateChange`/`onError`.

export {};

declare global {
  interface YTPlayer {
    getCurrentTime(): number;
    getDuration(): number;
    destroy(): void;
  }

  interface YTPlayerStateChangeEvent {
    data: number;
    target: YTPlayer;
  }

  interface YTPlayerErrorEvent {
    data: number;
    target: YTPlayer;
  }

  interface YTPlayerOptions {
    videoId: string;
    playerVars?: Record<string, number | string>;
    events?: {
      onReady?: (event: { target: YTPlayer }) => void;
      onStateChange?: (event: YTPlayerStateChangeEvent) => void;
      onError?: (event: YTPlayerErrorEvent) => void;
    };
  }

  interface YTNamespace {
    Player: new (element: HTMLElement, options: YTPlayerOptions) => YTPlayer;
    PlayerState: {
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  }

  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}
