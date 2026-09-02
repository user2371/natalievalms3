/**
 * `modules/payments/schema.ts` — ФАЗА PAID+, задача PAID+.4 (02.09.2026,
 * за прямим проханням користувача). Мінімальні типи, потрібні
 * `service.ts` — навмисно НЕ повний тип `Course`/`User` з
 * `modules/courses`/`modules/users` (той самий принцип незалежності
 * модулів, що вже задокументований у `modules/access/schema.ts`).
 */

/** Мінімум даних про курс, потрібний для запуску оплати. */
export interface PaymentsCourseInput {
  id: string;
  isPaid: boolean;
  priceUAH: number | null;
  title: string;
}

/** Мінімум даних про юзера, потрібний для запуску оплати (гість не може купувати — виклик лише за наявної сесії). */
export interface PaymentsUserInput {
  id: string;
}

/** Поля, які реально приходять у `data` LiqPay-вебхука — беремо лише те, що використовуємо, решту payload ігноруємо. */
export interface LiqpayCallbackPayload {
  order_id?: string;
  payment_id?: number | string;
  status?: string;
}
