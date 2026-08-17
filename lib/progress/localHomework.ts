/**
 * Здані відео ДЗ гостя/учениці — зберігаються в `localStorage`, за тим самим
 * патерном, що й `lib/progress/localProgress.ts` (прогрес уроків). Одне
 * посилання на урок (повторна здача перезаписує попередню). Дані звідси
 * читає і `HomeworkBlock` (щоб показати вже здане ДЗ при поверненні на
 * урок), і сторінка профілю `/profile` (секція "Мої домашні завдання" —
 * реальні здані відео у вбудованому плеєрі замість фото).
 *
 * При логіні/реєстрації (Фаза 3+) — one-time merge у БД
 * (`modules/homework` → `syncLocalHomework`), потім `localStorage` очищається
 * (`clearLocalHomeworkSubmissions`, вже готова для цього виклику).
 */

const STORAGE_KEY = "natalieva:progress:homework-submissions";

export interface LocalHomeworkSubmission {
  lessonSlug: string;
  videoUrl: string;
  /** ISO-дата здачі. */
  submittedAt: string;
}

function isSubmission(value: unknown): value is LocalHomeworkSubmission {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as LocalHomeworkSubmission).lessonSlug === "string" &&
    typeof (value as LocalHomeworkSubmission).videoUrl === "string" &&
    typeof (value as LocalHomeworkSubmission).submittedAt === "string"
  );
}

function readSubmissions(): LocalHomeworkSubmission[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSubmission) : [];
  } catch {
    return [];
  }
}

function writeSubmissions(list: LocalHomeworkSubmission[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage недоступний — тихо ігноруємо.
  }
}

/** Усі здані відео ДЗ, найновіші перші. */
export function getLocalHomeworkSubmissions(): LocalHomeworkSubmission[] {
  return readSubmissions().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/** Зберігає/перезаписує здане відео ДЗ для уроку і повертає оновлений список. */
export function saveLocalHomeworkSubmission(
  lessonSlug: string,
  videoUrl: string,
): LocalHomeworkSubmission[] {
  const withoutLesson = readSubmissions().filter((s) => s.lessonSlug !== lessonSlug);
  const next = [
    ...withoutLesson,
    { lessonSlug, videoUrl, submittedAt: new Date().toISOString() },
  ];
  writeSubmissions(next);
  return getLocalHomeworkSubmissions();
}

/** Використовується після one-time merge у БД при логіні/реєстрації (Фаза 3+). */
export function clearLocalHomeworkSubmissions() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ігноруємо
  }
}
