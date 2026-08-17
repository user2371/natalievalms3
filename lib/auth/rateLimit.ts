// Простий in-memory throttle для логіну (задача 2.24, позначена в
// TASKS_DETAILED.md як опційна — "простий throttle"). Обмежує кількість
// невдалих спроб входу за один email у вікні часу, щоб ускладнити
// брутфорс паролю. НЕ підходить для мультиінстансного/serverless деплою
// (лічильник живе в пам'яті процесу й скидається при рестарті) — для
// проду це потребувало б Redis/БД-лічильника, що виходить за межі MVP.

interface AttemptEntry {
  count: number;
  firstAttemptAt: number;
}

const attempts = new Map<string, AttemptEntry>();

const WINDOW_MS = 5 * 60 * 1000; // 5 хвилин
const MAX_ATTEMPTS = 5;

function isExpired(entry: AttemptEntry): boolean {
  return Date.now() - entry.firstAttemptAt > WINDOW_MS;
}

/** true, якщо для цього ключа (зазвичай email) вичерпано ліміт спроб. */
export function isLoginRateLimited(key: string): boolean {
  const entry = attempts.get(key);
  if (!entry) return false;
  if (isExpired(entry)) {
    attempts.delete(key);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

/** Викликається після кожної невдалої спроби логіну. */
export function recordFailedLoginAttempt(key: string): void {
  const entry = attempts.get(key);
  if (!entry || isExpired(entry)) {
    attempts.set(key, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  entry.count += 1;
}

/** Викликається після успішного логіну — скидає лічильник для цього email. */
export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}

/**
 * Фаза FIXES, задача F.20 ("Забув пароль"). Окремий лічильник/Map від
 * `attempts` вище — навмисно: там рахуються НЕВДАЛІ спроби логіну
 * (захист від брутфорсу пароля), тут — кількість самих ЗАПИТІВ на
 * скидання пароля (захист від спаму листами через Resend і від
 * використання форми як інструменту для email-бомбінгу чужої адреси).
 * Довше вікно й менший ліміт, ніж у логіну — цю дію очікувано
 * викликають рідко.
 */
const passwordResetRequests = new Map<string, AttemptEntry>();
const PASSWORD_RESET_WINDOW_MS = 15 * 60 * 1000; // 15 хвилин
const PASSWORD_RESET_MAX_ATTEMPTS = 3;

function isPasswordResetEntryExpired(entry: AttemptEntry): boolean {
  return Date.now() - entry.firstAttemptAt > PASSWORD_RESET_WINDOW_MS;
}

/** true, якщо для цього email вичерпано ліміт запитів скидання пароля. */
export function isPasswordResetRateLimited(key: string): boolean {
  const entry = passwordResetRequests.get(key);
  if (!entry) return false;
  if (isPasswordResetEntryExpired(entry)) {
    passwordResetRequests.delete(key);
    return false;
  }
  return entry.count >= PASSWORD_RESET_MAX_ATTEMPTS;
}

/** Викликається після кожного запиту на скидання пароля (незалежно від того, чи існує такий email — інакше сам факт "лічильник не зріс" видав би, що email не знайдено). */
export function recordPasswordResetRequest(key: string): void {
  const entry = passwordResetRequests.get(key);
  if (!entry || isPasswordResetEntryExpired(entry)) {
    passwordResetRequests.set(key, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  entry.count += 1;
}
