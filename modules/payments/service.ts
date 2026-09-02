import {
  LIQPAY_CHECKOUT_URL,
  buildLiqpayCheckoutFields,
  decodeLiqpayData,
  verifyLiqpaySignature,
} from "@/lib/payments/liqpay";
import { ensureEnrollmentService } from "@/modules/progress";
import * as repository from "./repository";
import type { LiqpayCallbackPayload, PaymentsCourseInput, PaymentsUserInput } from "./schema";

/**
 * `modules/payments/service.ts` — ФАЗА PAID+, задача PAID+.4 (02.09.2026,
 * за прямим проханням користувача). Той самий підхід `${NEXT_PUBLIC_APP_URL}`
 * з фолбеком на `http://localhost:3000`, що вже `lib/email/passwordResetMail.ts`/
 * `lib/email/emailChangeMail.ts` — тут для `result_url`/`server_url` запиту
 * до LiqPay.
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** LiqPay-статуси, що означають "гроші реально надійшли" — `sandbox` це тестовий еквівалент `success` у тестовому режимі провайдера (той самий тестовий чекаут, що й наданими sandbox-ключами). */
const SUCCESS_STATUSES = new Set(["success", "sandbox"]);
/** LiqPay-статуси явної відмови — переводимо `PENDING → FAILED`, а не лишаємо висіти. */
const FAILURE_STATUSES = new Set(["failure", "error"]);

/**
 * Запускає купівлю платного курсу (задача PAID+.4.1): створює
 * `CoursePurchase` зі статусом `PENDING` + власним ідемпотентним
 * `providerOrderId` (PAID+.0.3), формує підписаний запит до LiqPay.
 * Викликається лише за наявної сесії (`user` обов'язковий, на відміну
 * від `modules/access` — гість не може ініціювати оплату, той самий
 * принцип "платний курс вимагає авторизації", що вже в PAID+.1.1).
 */
export async function initiatePurchaseService(
  course: PaymentsCourseInput,
  user: PaymentsUserInput,
): Promise<{ checkoutUrl: string; data: string; signature: string }> {
  if (!course.isPaid || course.priceUAH == null) {
    throw new Error("Курс не є платним");
  }

  const purchase = await repository.createPendingPurchase({
    userId: user.id,
    courseId: course.id,
    amountUAH: course.priceUAH,
  });

  const { data, signature } = buildLiqpayCheckoutFields({
    orderId: purchase.providerOrderId,
    amountUAH: course.priceUAH,
    description: `Оплата курсу «${course.title}»`,
    // Лише UX-редірект браузера юзера після чекауту — НЕ джерело істини
    // (PAID+.4.2), тому веде просто на лендінг курсу (де `hasCourseAccess`
    // вже сам перевірить, чи вебхук встиг обробитись).
    resultUrl: `${APP_URL}/courses`,
    serverUrl: `${APP_URL}/api/payments/liqpay/webhook`,
  });

  return { checkoutUrl: LIQPAY_CHECKOUT_URL, data, signature };
}

/**
 * Обробляє server-to-server вебхук LiqPay (задача PAID+.4.2 — джерело
 * істини для статусу оплати, не редірект юзера). Кидає помилку при
 * недійсному підпису чи відсутньому `order_id` — виклик
 * (`app/api/payments/liqpay/webhook/route.ts`) вирішує, яким HTTP-статусом
 * відповісти LiqPay.
 *
 * Ідемпотентність (PAID+.4.3): чужий/невідомий `order_id` — тихо
 * ігнорується (не кидає помилку), а не наш ретрай/чужий продукт на тому
 * самому LiqPay-акаунті не повинен засмічувати логи помилками.
 * `repository.markPurchaseCompleted` сам вже не чіпає раніше завершені
 * записи, тому повторний вебхук з тим самим `order_id` — безпечний ноуп.
 */
export async function handleLiqpayCallbackService(
  rawData: string,
  rawSignature: string,
): Promise<void> {
  if (!verifyLiqpaySignature(rawData, rawSignature)) {
    throw new Error("Недійсний підпис LiqPay-вебхука");
  }

  const payload = decodeLiqpayData(rawData) as LiqpayCallbackPayload;
  if (!payload.order_id) {
    throw new Error("Вебхук LiqPay без order_id");
  }

  const purchase = await repository.findPurchaseByOrderId(payload.order_id);
  if (!purchase) {
    return;
  }

  if (payload.status && SUCCESS_STATUSES.has(payload.status)) {
    const justCompleted = await repository.markPurchaseCompleted({
      providerOrderId: purchase.providerOrderId,
      providerPaymentId: String(payload.payment_id ?? ""),
    });

    // ФАЗА PAID+, задача PAID+.4.5 (рішення): `Enrollment` створюється й
    // тут (окремо від `CoursePurchase`), щоб платний курс одразу з'явився
    // в "Моєму навчанні" так само, як безкоштовний, а не лишався видимим
    // лише через прямий лендінг курсу. `ensureEnrollmentService` сам
    // ідемпотентний (upsert), тому викликаємо його незалежно від
    // `justCompleted` — повторний вебхук-ретрай так само безпечний.
    void justCompleted;
    await ensureEnrollmentService(purchase.userId, purchase.courseId);
    return;
  }

  if (payload.status && FAILURE_STATUSES.has(payload.status)) {
    await repository.markPurchaseFailed(purchase.providerOrderId);
  }
}
