import { cn } from "@/lib/utils";
import {
  YoutubePlayer,
  type YoutubePlayerProgress,
} from "@/components/lesson/YoutubePlayer";

export type VideoProvider = "YOUTUBE" | "CUSTOM";

export interface VideoPlayerProps {
  /**
   * Провайдер відео. Наразі підтримується лише "YOUTUBE" (реальний YouTube
   * IFrame Player API через `YoutubePlayer.tsx`, задача 4.3). "CUSTOM"
   * зарезервовано під майбутній self-hosted плеєр — контракт компонента
   * (усі пропси нижче) не залежить від провайдера, тож підключення нового
   * провайдера не вимагатиме зміни коду сторінок, що використовують
   * `<VideoPlayer />` (задокументовано детальніше в `CLAUDE.md`).
   */
  provider?: VideoProvider;
  videoId: string;
  title: string;
  className?: string;
  /** Періодичний коллбек під час відтворення (задача 4.1/4.5) — поки підтримується лише для "YOUTUBE". */
  onProgress?: (progress: YoutubePlayerProgress) => void;
  /** Коллбек, коли відео догралось до кінця (задача 4.1/4.5) — поки підтримується лише для "YOUTUBE". */
  onEnded?: () => void;
}

/**
 * Респонсивний (16:9) відео-блок — диспетчер за `provider` (задача 4.2).
 * "YOUTUBE" рендерить `YoutubePlayer` (реальний YouTube IFrame API,
 * задача 4.3); будь-який інший провайдер (поки лише "CUSTOM" —
 * зарезервовано на майбутнє) показує той самий фолбек, що й помилка
 * відтворення (задача 4.7) — бо self-hosted плеєр ще не реалізований, а
 * не тому що це та сама помилка; текст свідомо однаковий, щоб не плодити
 * зайві варіанти повідомлень для стану "відео зараз недоступне".
 */
export function VideoPlayer({
  provider = "YOUTUBE",
  videoId,
  title,
  className,
  onProgress,
  onEnded,
}: VideoPlayerProps) {
  if (provider !== "YOUTUBE") {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-2xl bg-ink text-sm text-white/70",
          className,
        )}
      >
        Відео недоступне
      </div>
    );
  }

  return (
    <YoutubePlayer
      videoId={videoId}
      title={title}
      className={className}
      onProgress={onProgress}
      onEnded={onEnded}
    />
  );
}
