/**
 * Налаштування профілю, що впливають на те, що бачать ІНШІ на публічній
 * сторінці `/users/[id]` — зберігаються в `localStorage`, той самий патерн,
 * що й `localProgress.ts`. Наразі єдине налаштування — видимість секції
 * "Домашні завдання" (задача 0.9.5). UI-перемикач для нього зʼявиться в
 * `Налаштуваннях` (задача 0.10.6) — цей модуль уже готовий для підключення,
 * щоб не переписувати сторінку профілю пізніше.
 */

const HOMEWORK_VISIBLE_KEY = "natalieva:settings:homework-visible";

/** Повертає, чи власник дозволив показувати ДЗ на публічному профілі (за замовчуванням — так). */
export function getHomeworkVisible(): boolean {
  if (typeof window === "undefined") return true;

  try {
    const raw = window.localStorage.getItem(HOMEWORK_VISIBLE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

/** Записує вибір видимості ДЗ. Викликатиметься з перемикача в Налаштуваннях (0.10.6). */
export function setHomeworkVisible(visible: boolean) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(HOMEWORK_VISIBLE_KEY, String(visible));
  } catch {
    // ігноруємо — localStorage недоступний
  }
}
