"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckIcon, YoutubeIcon } from "@/components/ui/icons";
import { DEFAULT_HOMEWORK_ITEMS } from "@/lib/data/lessons";
import { isYoutubeUrl } from "@/lib/youtube";
import { useLocalHomework } from "@/lib/progress/useLocalHomework";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { GuestHomeworkBanner } from "@/components/lesson/GuestHomeworkBanner";

export interface HomeworkBlockProps {
  /** Slug уроку — ключ, під яким здане відео зберігається в localStorage. */
  lessonSlug: string;
  /** Пункти ДЗ. Якщо не передано — використовується типовий чекліст. */
  items?: string[];
  /** Чи залогінений відвідувач (задача 0.19) — гість бачить банер замість форми здачі. */
  loggedIn: boolean;
  className?: string;
}

/**
 * Блок "Домашнє завдання" (задача 0.7.11): список пунктів + здача ДЗ
 * посиланням на відео зі свого YouTube-каналу (замість фото). Ідея: учениця
 * заводить власний YouTube-канал і викладає туди виконання завдань — це і
 * доказ прогресу для курсу, і старт її власного каналу як майбутньої
 * майстрині. Здане посилання зберігається в `localStorage`
 * (`lib/progress/localHomework.ts`) — при поверненні на урок воно вже тут,
 * і воно ж одразу зʼявляється на профілі (`/profile`) у вбудованому
 * YouTube-плеєрі замість фото. Реальне server-side збереження через
 * `modules/homework` — Фаза 3.
 *
 * 19.07.2026, сесія 17, за прямим проханням користувача: здача ДЗ тепер
 * вимагає логіну (`loggedIn`, той самий проп і той самий патерн гейту, що
 * `CommentsBlock`/`GuestCommentBanner`) — у `localStorage` для гостя
 * повинен зберігатись лише прогрес проходження уроків/квізів, не здані
 * домашні завдання. Чекліст пунктів ДЗ гість усе ще бачить, лише форму
 * здачі відео замінено на `GuestHomeworkBanner`.
 */
export function HomeworkBlock({
  lessonSlug,
  items = DEFAULT_HOMEWORK_ITEMS,
  loggedIn,
  className,
}: HomeworkBlockProps) {
  const { submissions, submit } = useLocalHomework();
  const { openAuthModal } = useAuthModal();
  const existing = submissions.find((s) => s.lessonSlug === lessonSlug);

  const [link, setLink] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submittedUrl = editing ? null : (existing?.videoUrl ?? null);

  function handleSubmit() {
    const trimmed = link.trim();

    if (!trimmed) {
      setError("Встав посилання на відео ДЗ зі свого YouTube-каналу");
      return;
    }

    if (!isYoutubeUrl(trimmed)) {
      setError("Це не схоже на посилання YouTube. Приклад: https://youtu.be/…");
      return;
    }

    setError(null);
    submit(lessonSlug, trimmed);
    setEditing(false);
    setLink("");
  }

  return (
    <Card padding="lg" className={className}>
      <h2 className="font-serif text-xl text-ink">Домашнє завдання</h2>

      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm text-ink/90">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft/60 text-accent-dark">
              <CheckIcon size={12} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-rose-line/30 pt-5">
        {submittedUrl ? (
          <div className="flex items-center gap-2.5 rounded-xl bg-success/10 px-4 py-3 text-sm text-ink">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckIcon size={14} />
            </span>
            <span className="flex-1">
              ДЗ здано —{" "}
              <a
                href={submittedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-accent-dark underline underline-offset-2"
              >
                переглянути відео
              </a>
            </span>
            <button
              type="button"
              onClick={() => {
                setLink(submittedUrl);
                setEditing(true);
              }}
              className="shrink-0 text-xs font-medium text-muted hover:text-ink"
            >
              Змінити
            </button>
          </div>
        ) : !loggedIn ? (
          <GuestHomeworkBanner onLoginClick={() => openAuthModal("register")} />
        ) : (
          <>
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
              <div className="flex-1">
                <Input
                  icon={<YoutubeIcon size={17} />}
                  type="url"
                  placeholder="https://youtu.be/…"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    if (error) setError(null);
                  }}
                  error={error ?? undefined}
                  aria-label="Посилання на відео ДЗ"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit}
                className="shrink-0"
              >
                Здати відео ДЗ
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Встав посилання на відео виконаного завдання зі свого YouTube-каналу. Немає
              каналу? Створи його — це чудовий спосіб фіксувати власний прогрес і почати
              розвивати портфоліо майбутньої майстрині. Здане відео одразу зʼявиться і на
              твоєму профілі.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
