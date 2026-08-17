"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface YoutubePlayerProgress {
  currentTime: number;
  duration: number;
}

export interface YoutubePlayerProps {
  videoId: string;
  title: string;
  className?: string;
  /** Періодичний коллбек під час відтворення (задача 4.5), приблизно раз на секунду. */
  onProgress?: (progress: YoutubePlayerProgress) => void;
  /** Коллбек, коли відео догралось до кінця (задача 4.5). */
  onEnded?: () => void;
}

const PROGRESS_INTERVAL_MS = 1000;

/**
 * Один раз на увесь застосунок завантажує скрипт YouTube IFrame API
 * (`https://www.youtube.com/iframe_api`) і повертає проміс, що резолвиться,
 * коли `window.YT.Player` стає доступним. Кілька одночасних інстансів
 * `YoutubePlayer` (наприклад, кілька вкладок) діляться одним промісом —
 * скрипт не завантажується повторно.
 */
let apiReadyPromise: Promise<void> | null = null;

function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.YT?.Player) {
    return Promise.resolve();
  }
  if (apiReadyPromise) {
    return apiReadyPromise;
  }

  apiReadyPromise = new Promise((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });

  return apiReadyPromise;
}

/**
 * Обгортка над реальним YouTube IFrame Player API (задача 4.3) — на відміну
 * від Фази 0 (звичайний `<iframe src="…/embed/…">`), тут створюється
 * керований JS-об'єкт `YT.Player`, що дає доступ до подій відтворення
 * (задача 4.5: `onEnded`, `onProgress`) і помилок (задача 4.7).
 *
 * **Рішення щодо контролів (задача 4.6, задокументовано детальніше в
 * `CLAUDE.md`): нативні контроли YouTube, а не кастомний оверлей.**
 * `VideoPlayerControls.tsx` (плейсхолдер із Фази 0) свідомо НЕ підключений
 * до реального стану плеєра тут — керування play/pause/гучністю через
 * `postMessage`-команди API поверх нативного UI означало б або дублювати
 * контроли (плутанина для користувача — дві панелі керування одним відео),
 * або повністю приховувати нативні (втрата стандартних жестів/клавіш
 * доступності, які YouTube вже дає з коробки). Нативні контроли — простіше
 * і надійніше рішення для MVP.
 */
export function YoutubePlayer({
  videoId,
  title,
  className,
  onProgress,
  onEnded,
}: YoutubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function clearProgressInterval() {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }

    loadYoutubeIframeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) {
        return;
      }

      setHasError(false);
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onStateChange: (event) => {
            const YT = window.YT;
            if (!YT) return;

            if (event.data === YT.PlayerState.ENDED) {
              clearProgressInterval();
              onEnded?.();
              return;
            }

            if (event.data === YT.PlayerState.PLAYING && onProgress) {
              clearProgressInterval();
              progressIntervalRef.current = setInterval(() => {
                const player = playerRef.current;
                if (!player) return;
                onProgress({
                  currentTime: player.getCurrentTime(),
                  duration: player.getDuration(),
                });
              }, PROGRESS_INTERVAL_MS);
            } else {
              clearProgressInterval();
            }
          },
          // Задача 4.7: некоректний/недоступний videoId (видалене,
          // приватне або неіснуюче відео) — YouTube API віддає код
          // помилки замість тихого збою; показуємо той самий фолбек, що
          // й для `provider !== "YOUTUBE"` у `VideoPlayer.tsx`.
          onError: () => {
            if (!cancelled) setHasError(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      clearProgressInterval();
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  if (hasError) {
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
    // Задача 4.8: контейнер лишається `aspect-video` (16:9), незалежно від
    // ширини — `YT.Player` сам розтягує внутрішній iframe на 100%
    // ширини/висоти батьківського елемента.
    <div
      className={cn(
        "aspect-video overflow-hidden rounded-2xl bg-ink shadow-sm",
        className,
      )}
      aria-label={title}
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
