/**
 * Коментарі та реакції (лайк/дизлайк), додані самим користувачем —
 * зберігаються в `localStorage`, за тим самим патерном, що й
 * `lib/progress/localHomework.ts`/`localProgress.ts`. Базові демо-коментарі
 * (`lib/data/comments.ts`) звідси не читаються — цей шар відповідає лише за
 * те, що додав/змінив сам користувач у цій сесії браузера.
 *
 * При логіні/реєстрації (Фаза 3+) — one-time merge у БД
 * (`modules/comments` → `syncLocalComments`), потім `localStorage`
 * очищається (`clearLocalComments`, вже готова для цього виклику).
 */

import type { Comment } from "@/lib/data/comments";

const COMMENTS_KEY = "natalieva:comments:by-lesson";
const REACTIONS_KEY = "natalieva:comments:reactions";

export type Reaction = "like" | "dislike";

function isComment(value: unknown): value is Comment {
  const c = value as Comment;
  return (
    typeof value === "object" &&
    value !== null &&
    typeof c.id === "string" &&
    typeof c.lessonSlug === "string" &&
    typeof c.authorId === "string" &&
    typeof c.authorName === "string" &&
    typeof c.createdAt === "string" &&
    typeof c.text === "string"
  );
}

function readComments(): Comment[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(COMMENTS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isComment) : [];
  } catch {
    return [];
  }
}

function writeComments(list: Comment[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(COMMENTS_KEY, JSON.stringify(list));
  } catch {
    // localStorage недоступний — тихо ігноруємо.
  }
}

/** Власні коментарі користувача під конкретним уроком, найновіші перші. */
export function getLocalComments(lessonSlug: string): Comment[] {
  return readComments()
    .filter((c) => c.lessonSlug === lessonSlug)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Додає новий коментар і повертає оновлений список для цього уроку. */
export function addLocalComment(
  lessonSlug: string,
  comment: Omit<Comment, "lessonSlug" | "createdAt" | "likes" | "dislikes">,
): Comment[] {
  const next: Comment = {
    ...comment,
    lessonSlug,
    createdAt: new Date().toISOString(),
    likes: 0,
    dislikes: 0,
  };
  writeComments([...readComments(), next]);
  return getLocalComments(lessonSlug);
}

/** Видаляє коментар (лише власні — демо-коментарі тут не зберігаються). */
export function deleteLocalComment(lessonSlug: string, commentId: string): Comment[] {
  writeComments(readComments().filter((c) => c.id !== commentId));
  return getLocalComments(lessonSlug);
}

function readReactions(): Record<string, Reaction> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(REACTIONS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, Reaction] =>
          entry[1] === "like" || entry[1] === "dislike",
      ),
    );
  } catch {
    return {};
  }
}

function writeReactions(map: Record<string, Reaction>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(REACTIONS_KEY, JSON.stringify(map));
  } catch {
    // ігноруємо
  }
}

/** Власні реакції (лайк/дизлайк) на коментарі: id коментаря -> реакція. */
export function getLocalReactions(): Record<string, Reaction> {
  return readReactions();
}

/**
 * Перемикає реакцію на коментарі: повторний клік на ту саму реакцію знімає
 * її, клік на протилежну — замінює (лайк знімає дизлайк і навпаки, задача
 * 0.7.23a).
 */
export function toggleLocalReaction(
  commentId: string,
  reaction: Reaction,
): Record<string, Reaction> {
  const current = readReactions();
  const next = { ...current };

  if (next[commentId] === reaction) {
    delete next[commentId];
  } else {
    next[commentId] = reaction;
  }

  writeReactions(next);
  return getLocalReactions();
}

/** Використовується після one-time merge у БД при логіні/реєстрації (Фаза 3+). */
export function clearLocalComments() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(COMMENTS_KEY);
    window.localStorage.removeItem(REACTIONS_KEY);
  } catch {
    // ігноруємо
  }
}
