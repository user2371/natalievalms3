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

/**
 * Фаза FIXES, задача F.26 (підтвердження email кодом перед
 * реєстрацією). Окремий, короткий кулдаун саме для "Надіслати код ще
 * раз" — на відміну від `passwordResetRequests` вище (15 хв/3 спроби,
 * захист від спаму формою "Забув пароль"), тут людина цілком очікувано
 * може захотіти повторний лист швидко (код не дійшов/попав у спам), але
 * без обмеження це стало б інструментом email-бомбінгу довільної
 * адреси через `resendRegistrationCodeAction`. 60 секунд між запитами —
 * достатньо, щоб зупинити спам, і не заважає реальному користувачу.
 */
const resendCodeRequests = new Map<string, AttemptEntry>();
const RESEND_CODE_COOLDOWN_MS = 60 * 1000; // 60 секунд

/** true, якщо для цього email ще не минув кулдаун "надіслати ще раз". */
export function isResendCodeRateLimited(key: string): boolean {
  const entry = resendCodeRequests.get(key);
  if (!entry) return false;
  return Date.now() - entry.firstAttemptAt < RESEND_CODE_COOLDOWN_MS;
}

/** Викликається після кожного (успішного) запиту "надіслати код ще раз". */
export function recordResendCodeRequest(key: string): void {
  resendCodeRequests.set(key, { count: 1, firstAttemptAt: Date.now() });
}

/** Скільки секунд лишилось до можливості повторного запиту (для UI-таймера). */
export function getResendCodeCooldownRemainingSeconds(key: string): number {
  const entry = resendCodeRequests.get(key);
  if (!entry) return 0;
  const remainingMs = RESEND_CODE_COOLDOWN_MS - (Date.now() - entry.firstAttemptAt);
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

/**
 * Throttle на сам крок 1 реєстрації (`requestRegistrationAction`) за
 * email — щоб не можна було нескінченно спамити ту саму адресу
 * листами через повторні `POST` на форму реєстрації (окремий від
 * кулдауну "надіслати ще раз" вище, бо йде в дію ще ДО того, як
 * з'явився сам `PendingRegistration`/кнопка резенду). Те саме вікно/
 * ліміт, що вже для `passwordResetRequests`.
 */
const registrationRequests = new Map<string, AttemptEntry>();
const REGISTRATION_REQUEST_WINDOW_MS = 15 * 60 * 1000; // 15 хвилин
const REGISTRATION_REQUEST_MAX_ATTEMPTS = 3;

function isRegistrationRequestExpired(entry: AttemptEntry): boolean {
  return Date.now() - entry.firstAttemptAt > REGISTRATION_REQUEST_WINDOW_MS;
}

/** true, якщо для цього email вичерпано ліміт запитів реєстрації (крок 1). */
export function isRegistrationRateLimited(key: string): boolean {
  const entry = registrationRequests.get(key);
  if (!entry) return false;
  if (isRegistrationRequestExpired(entry)) {
    registrationRequests.delete(key);
    return false;
  }
  return entry.count >= REGISTRATION_REQUEST_MAX_ATTEMPTS;
}

/** Викликається після кожного запиту реєстрації (крок 1), незалежно від успіху. */
export function recordRegistrationRequest(key: string): void {
  const entry = registrationRequests.get(key);
  if (!entry || isRegistrationRequestExpired(entry)) {
    registrationRequests.set(key, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  entry.count += 1;
}
