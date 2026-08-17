// Простий in-memory throttle коментарів (задача 6.5.18, позначена в
// TASKS_DETAILED.md як опційна — "базовий rate-limit/анти-спам"). Той
// самий підхід, що й `lib/auth/rateLimit.ts` (throttle логіну, задача
// 2.24): обмежує ЧАСТОТУ (не кількість спроб) — один коментар не частіше
// ніж раз на `MIN_INTERVAL_MS` для одного `userId`. НЕ підходить для
// мультиінстансного/serverless деплою (лічильник живе в пам'яті процесу
// й скидається при рестарті) — для проду це потребувало б Redis/БД, що
// виходить за межі MVP (та сама причина, що й у `lib/auth/rateLimit.ts`).

const lastCommentAt = new Map<string, number>();

const MIN_INTERVAL_MS = 15 * 1000; // 15 секунд між коментарями одного юзера

/** true, якщо цей `userId` уже залишав коментар менш ніж `MIN_INTERVAL_MS` тому. */
export function isCommentRateLimited(userId: string): boolean {
  const last = lastCommentAt.get(userId);
  if (last === undefined) return false;
  return Date.now() - last < MIN_INTERVAL_MS;
}

/** Викликається після кожного УСПІШНОГО додавання коментаря. */
export function recordCommentAttempt(userId: string): void {
  lastCommentAt.set(userId, Date.now());
}
