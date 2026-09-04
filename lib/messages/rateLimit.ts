// Rate limiting на надсилання повідомлень (MSG+.4.3, 04.09.2026) —
// простий лічильник "N повідомлень за M секунд" на юзера, той самий
// підхід і той самий відомий виняток, що вже `lib/comments/rateLimit.ts`
// (in-memory, не підходить для мультиінстансного/serverless деплою —
// для проду знадобився б Redis/БД, за межами MVP). На відміну від
// коментарів (простий мінімальний інтервал між ДІЯМИ), тут — ковзне
// вікно з лічильником К-СТІ (`sendMessageService`/`startConversationService`
// теж рахуються — обидва створюють `Message`/`Conversation`), бо
// приватний чат передбачає природну "чергу коротких повідомлень"
// поспіль, яку мінімальний інтервал між кожним придушив би зайво.

const MAX_MESSAGES = 10;
const WINDOW_MS = 30 * 1000; // 10 повідомлень за 30 секунд на юзера

const sentTimestamps = new Map<string, number[]>();

/** true, якщо цей `userId` уже надіслав `MAX_MESSAGES` повідомлень за останні `WINDOW_MS`. */
export function isMessageRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = sentTimestamps.get(userId);
  if (!timestamps) return false;
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);
  return recent.length >= MAX_MESSAGES;
}

/** Викликається після кожного УСПІШНОГО надсилання повідомлення. */
export function recordMessageSent(userId: string): void {
  const now = Date.now();
  const timestamps = sentTimestamps.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  sentTimestamps.set(userId, recent);
}
