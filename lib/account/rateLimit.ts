// Простий in-memory throttle для чутливих дій акаунта (задача 3+.0.4) —
// той самий свідомий компроміс, що вже прийнятий і задокументований у
// `lib/auth/rateLimit.ts` (задача 2.24): "простий in-memory, не для
// serverless/мультиінстансного деплою" — лічильник живе в пам'яті
// процесу й скидається при рестарті.
//
// НАВМИСНО окремий файл/лічильник від `lib/auth/rateLimit.ts`, а не
// перевикористання того самого модуля: там ключ — email (анонімна дія,
// до логіну), тут — `userId` (дія вже залогіненого користувача); різні
// простори ключів і різне призначення (там захист від брутфорсу пароля
// логіну, тут — від брутфорсу ПОТОЧНОГО пароля в діях зміни email/пароля,
// 3+.2/3+.3). Застосовується лише там, де дія перевіряє поточний
// пароль — на аватар (3+.1) не поширюється, там немає перевірки пароля.

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

/** true, якщо для цього userId вичерпано ліміт спроб чутливої дії. */
export function isAccountActionRateLimited(userId: string): boolean {
  const entry = attempts.get(userId);
  if (!entry) return false;
  if (isExpired(entry)) {
    attempts.delete(userId);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

/** Викликається після кожної невдалої перевірки поточного пароля. */
export function recordFailedAccountAction(userId: string): void {
  const entry = attempts.get(userId);
  if (!entry || isExpired(entry)) {
    attempts.set(userId, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  entry.count += 1;
}

/** Викликається після успішної дії — скидає лічильник для цього userId. */
export function clearAccountActionAttempts(userId: string): void {
  attempts.delete(userId);
}
