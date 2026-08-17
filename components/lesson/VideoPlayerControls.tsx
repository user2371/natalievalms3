"use client";

import { useState } from "react";
import {
  PlayIcon,
  PauseIcon,
  VolumeIcon,
  GearIcon,
  PictureInPictureIcon,
  FullscreenIcon,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface VideoPlayerControlsProps {
  className?: string;
}

/**
 * Плейсхолдер панелі контролів під відео-блоком уроку (задача 0.7.10).
 * Демо-UI без реального керування YouTube-плеєром (play/pause лише
 * перемикає іконку для показу стану).
 *
 * 24.07.2026, Фаза 4 (задача 4.6): свідомо НЕ підключений до реального
 * `YT.Player` і ніде в проєкті не рендериться поряд з `VideoPlayer` —
 * рішення на користь нативних контролів YouTube, детально пояснено в
 * `CLAUDE.md` (розділ "Video abstraction") і в `YoutubePlayer.tsx`.
 * Компонент лишається в кодовій базі як задокументований невикористаний
 * демо-приклад, не помилка/недогляд.
 */
export function VideoPlayerControls({ className }: VideoPlayerControlsProps) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setPlaying((prev) => !prev)}
        aria-label={playing ? "Пауза" : "Відтворити"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
      >
        {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </button>

      <span className="w-16 shrink-0 text-xs text-white/70 tabular-nums">
        2:34 / 12:10
      </span>

      <div
        role="slider"
        aria-label="Прогрес відтворення"
        aria-valuenow={21}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 flex-1 cursor-pointer rounded-full bg-white/20"
      >
        <div className="h-full w-[21%] rounded-full bg-white" />
      </div>

      <button
        type="button"
        onClick={() => setMuted((prev) => !prev)}
        aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
      >
        <VolumeIcon size={17} className={muted ? "text-white/40" : undefined} />
      </button>

      <button
        type="button"
        aria-label="Налаштування відео"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
      >
        <GearIcon size={17} />
      </button>

      <button
        type="button"
        aria-label="Картинка в картинці"
        className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 sm:flex"
      >
        <PictureInPictureIcon size={17} />
      </button>

      <button
        type="button"
        aria-label="На весь екран"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10"
      >
        <FullscreenIcon size={17} />
      </button>
    </div>
  );
}
