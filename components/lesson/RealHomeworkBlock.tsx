"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CheckIcon, YoutubeIcon } from "@/components/ui/icons";
import { DEFAULT_HOMEWORK_ITEMS } from "@/lib/data/lessons";
import { submitHomeworkAction } from "@/modules/homework";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { GuestHomeworkBanner } from "@/components/lesson/GuestHomeworkBanner";

const NETWORK_ERROR_MESSAGE = "Проблема з мережею. Перевір з'єднання і спробуй ще раз.";

export interface RealHomeworkBlockProps {
  lessonId: string;
  /** Уже здане відео цього уроку (з сервера, `getHomeworkForLessonService`) — `null`, якщо ще не здавали або гість. */
  initialVideoUrl: string | null;
  className?: string;
}

/**
 * Реальна (Prisma) версія `HomeworkBlock.tsx` для сторінки уроку
 * `/courses/[slug]/lessons/[lessonId]` — закриває прогалину №1, знайдену
 * під час трасування 9.15 (`modules/homework` не існував). Той самий UI/UX,
 * що й у легасі-версії (список пунктів ДЗ + форма здачі посилання на
 * YouTube, `GuestHomeworkBanner` для гостя), але:
 * - джерело правди — `getHomeworkForLessonService`/`submitHomeworkAction`
 *   (реальна БД), а не `localStorage`;
 * - `loggedIn` тут не проп ззовні, а `useSession()` напряму (той самий
 *   підхід, що й `RealCommentsBlock`/`RealQuizBlock`);
 * - той самий захист від подвійного кліку (`pending`-стан, задача 9.13) і
 *   `try/catch` навколо виклику дії з окремим повідомленням для мережевого
 *   збою (задача 9.14), що вже застосовано в `RealCommentsBlock.tsx`.
 *
 * Пункти ДЗ (чекліст) лишаються статичними (`DEFAULT_HOMEWORK_ITEMS`) — у
 * Prisma-схемі немає окремого поля/моделі для кастомних пунктів ДЗ на
 * урок, і це не входило до знайдених прогалин 9.15 (сам сценарій вимагав
 * лише робочої ЗДАЧІ відео, не редагованого адміном чекліста) — окрема
 * майбутня задача, якщо знадобиться.
 */
export function RealHomeworkBlock({
  lessonId,
  initialVideoUrl,
  className,
}: RealHomeworkBlockProps) {
  const { status } = useSession();
  const { openAuthModal } = useAuthModal();
  const loggedIn = status === "authenticated";

  const [submittedUrl, setSubmittedUrl] = useState<string | null>(initialVideoUrl);
  const [link, setLink] = useState("");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const showForm = editing || !submittedUrl;

  async function handleSubmit() {
    const trimmed = link.trim();

    if (!trimmed) {
      setError("Встав посилання на відео ДЗ зі свого YouTube-каналу");
      return;
    }

    setError(null);
    setPending(true);

    try {
      const result = await submitHomeworkAction({ lessonId, videoUrl: trimmed });
      if (result.success) {
        setSubmittedUrl(result.submission.videoUrl);
        setEditing(false);
        setLink("");
      } else {
        setError(result.error ?? "Не вдалося здати домашнє завдання");
      }
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card padding="lg" className={className}>
      <h2 className="font-serif text-xl text-ink">Домашнє завдання</h2>

      <ul className="mt-4 flex flex-col gap-2.5">
        {DEFAULT_HOMEWORK_ITEMS.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5 text-sm text-ink/90">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft/60 text-accent-dark">
              <CheckIcon size={12} />
            </span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-rose-line/30 pt-5">
        {!loggedIn ? (
          <GuestHomeworkBanner onLoginClick={() => openAuthModal("register")} />
        ) : !showForm && submittedUrl ? (
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
                  disabled={pending}
                  aria-label="Посилання на відео ДЗ"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmit}
                disabled={pending}
                loading={pending}
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
