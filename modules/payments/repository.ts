import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * `modules/payments/repository.ts` — ФАЗА PAID+, задача PAID+.4
 * (02.09.2026, за прямим проханням користувача). Лише прямі запити до
 * Prisma, без бізнес-логіки (той самий поділ, що вже
 * `modules/access/repository.ts`/`modules/courses/repository.ts`).
 */

/**
 * Створює запис `CoursePurchase` зі статусом `PENDING` і власним
 * ідемпотентним `providerOrderId` (задача PAID+.0.3 — генерується ДО
 * відправки запиту провайдеру, а не береться з відповіді LiqPay,
 * джерело істини для вебхук-ретраїв, PAID+.4.3).
 */
export async function createPendingPurchase(params: {
  userId: string;
  courseId: string;
  amountUAH: number;
}): Promise<{ id: string; providerOrderId: string }> {
  const providerOrderId = randomUUID();
  return prisma.coursePurchase.create({
    data: {
      userId: params.userId,
      courseId: params.courseId,
      amountUAH: params.amountUAH,
      provider: "liqpay",
      providerOrderId,
      status: "PENDING",
    },
    select: { id: true, providerOrderId: true },
  });
}

export async function findPurchaseByOrderId(providerOrderId: string) {
  return prisma.coursePurchase.findUnique({ where: { providerOrderId } });
}

/**
 * Ідемпотентне завершення покупки (задача PAID+.4.3 — той самий принцип,
 * що вже `ensureEnrollment` (`@@unique` + upsert): вебхук може прийти
 * повторно (мережеві ретраї LiqPay), тому `where` явно виключає вже
 * `COMPLETED`-записи — повторний виклик з тим самим `providerOrderId`
 * нічого не змінює (`updateMany` на 0 рядків), а не перезаписує
 * `paidAt`/`providerPaymentId` вдруге. Повертає, чи ця конкретна відповідь
 * дійсно ЗМІНИЛА статус (а не була холостим ретраєм) — сервіс використовує
 * це, щоб не намагатись видати сертифікат/бали двічі, якщо колись такий
 * побічний ефект тут з'явиться.
 */
export async function markPurchaseCompleted(params: {
  providerOrderId: string;
  providerPaymentId: string;
}): Promise<boolean> {
  const result = await prisma.coursePurchase.updateMany({
    where: { providerOrderId: params.providerOrderId, status: { not: "COMPLETED" } },
    data: {
      status: "COMPLETED",
      providerPaymentId: params.providerPaymentId,
      paidAt: new Date(),
    },
  });
  return result.count > 0;
}

/** Аналогічно `markPurchaseCompleted`, лише для явної відмови LiqPay (`status: "failure"/"error"`) — не чіпає вже `COMPLETED`/`REFUNDED` записи. */
export async function markPurchaseFailed(providerOrderId: string): Promise<void> {
  await prisma.coursePurchase.updateMany({
    where: { providerOrderId, status: "PENDING" },
    data: { status: "FAILED" },
  });
}
