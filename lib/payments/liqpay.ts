import { createHash, timingSafeEqual } from "crypto";

/**
 * `lib/payments/liqpay.ts` — ФАЗА PAID+, задача PAID+.4 (02.09.2026, за
 * прямим проханням користувача). Чисті функції кодування/підпису запиту
 * LiqPay — офіційного підтримуваного Node.js SDK немає (задокументовано
 * в `TASKS_DETAILED.md`, розділ PAID+.4), тому інтеграція йде напряму
 * через протокол LiqPay поверх вбудованого `crypto`, той самий підхід
 * (підписаний токен вбудованими засобами Node, без нової залежності),
 * що вже `lib/auth/passwordResetToken.ts`/`lib/account/emailChangeToken.ts`
 * — лише інший алгоритм, бо так вимагає сам протокол LiqPay:
 *
 *   signature = base64( sha1( private_key + data + private_key ) )
 *
 * де `data` — base64(JSON) корисного навантаження запиту. Той самий
 * `data` іде в приховане поле форми чекауту І повертається LiqPay у
 * server-to-server вебхуку — обидва боки рахують той самий підпис зі
 * своєї копії `private_key`, тому підпис і є доказом автентичності
 * (без нього будь-хто міг би підробити "оплата успішна", той самий
 * ризик, що вже позначений у плані PAID+.4.2).
 *
 * `LIQPAY_PRIVATE_KEY` ЗАВЖДИ лишається лише на сервері — жодна функція
 * звідси не викликається з клієнтського коду (обидва виклики —
 * `modules/payments/service.ts`, сервер). `LIQPAY_PUBLIC_KEY` — свідомий
 * виняток (PAID+.4.4): він призначений саме для форми чекауту, тому
 * потрапляє всередину закодованого `data`.
 */

function getPublicKey(): string {
  const key = process.env.LIQPAY_PUBLIC_KEY;
  if (!key) {
    throw new Error("LIQPAY_PUBLIC_KEY не налаштовано");
  }
  return key;
}

function getPrivateKey(): string {
  const key = process.env.LIQPAY_PRIVATE_KEY;
  if (!key) {
    throw new Error("LIQPAY_PRIVATE_KEY не налаштовано");
  }
  return key;
}

/** Hosted-чекаут LiqPay (задача PAID+.4.1) — форма POST сюди з полями `data`/`signature`. */
export const LIQPAY_CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";

/** Кодує payload у `data`-поле запиту (base64 JSON) — те, що LiqPay очікує і в формі чекауту, і у вебхуці. */
export function encodeLiqpayData(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
}

/** Декодує `data`-поле назад у обʼєкт — використовується лише при обробці вебхука (`modules/payments/service.ts`). */
export function decodeLiqpayData(data: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
}

/** Рахує підпис за протоколом LiqPay для вже закодованого `data`. */
export function signLiqpayData(data: string): string {
  const privateKey = getPrivateKey();
  return createHash("sha1")
    .update(privateKey + data + privateKey, "utf-8")
    .digest("base64");
}

/**
 * Перевіряє підпис вебхука (задача PAID+.4.2 — "джерело істини — вебхук,
 * а не редірект юзера назад на сайт", тому саме тут, а не на
 * `result_url`, вирішується "оплату справді прийнято"). Порівняння через
 * `timingSafeEqual` (не `===`) — перше місце в проєкті, де порівнюється
 * секрет/підпис байт-в-байт (наявні `lib/auth/passwordResetToken.ts`/
 * `lib/account/emailChangeToken.ts` довіряють перевірці підпису самому
 * `jose`, а не порівнюють рядки вручну), тому захист від timing-атак
 * тут навмисно явний, а не запозичений з наявного коду. Різна довжина
 * буферів (спотворений/чужий підпис) — рахуємо як невідповідність без
 * падіння `timingSafeEqual` на різній довжині.
 */
export function verifyLiqpaySignature(data: string, signature: string): boolean {
  const expected = Buffer.from(signLiqpayData(data));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export interface BuildLiqpayCheckoutParams {
  /** Наш власний ідемпотентний `providerOrderId` (задача PAID+.0.3/PAID+.4.3) — джерело істини для вебхук-ретраїв. */
  orderId: string;
  amountUAH: number;
  description: string;
  /** Куди редіректиться браузер юзера ПІСЛЯ оплати — лише UX, не джерело істини (PAID+.4.2). */
  resultUrl: string;
  /** Server-to-server вебхук — джерело істини (PAID+.4.2). */
  serverUrl: string;
}

/** Формує `data`+`signature` для hosted-чекауту LiqPay (PAID+.4.1). */
export function buildLiqpayCheckoutFields(
  params: BuildLiqpayCheckoutParams,
): { data: string; signature: string } {
  const payload = {
    public_key: getPublicKey(),
    version: "3",
    action: "pay",
    amount: params.amountUAH,
    currency: "UAH",
    description: params.description,
    order_id: params.orderId,
    result_url: params.resultUrl,
    server_url: params.serverUrl,
    // "мова" чекауту — україномовна аудиторія курсу (той самий контекст
    // вибору провайдера, що вже в плані PAID+.4: "аудиторія — студентки
    // з України").
    language: "uk",
  };
  const data = encodeLiqpayData(payload);
  const signature = signLiqpayData(data);
  return { data, signature };
}
