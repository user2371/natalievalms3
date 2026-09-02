// `modules/payments/index.ts` — ФАЗА PAID+, задача PAID+.4 (02.09.2026,
// за прямим проханням користувача). UI-компоненти та сторінки (`app/**`)
// імпортують ТІЛЬКИ звідси, ніколи напряму з `repository.ts`/`service.ts`
// (правило з `CLAUDE.md`, розділ "Архітектура модулів"). Виняток —
// `handleLiqpayCallbackService`, який викликається лише з
// `app/api/payments/liqpay/webhook/route.ts` (не з UI), але так само
// проходить через цей публічний бар'єр.

export { initiateCoursePurchaseAction } from "./actions";
export { handleLiqpayCallbackService } from "./service";
export type { PaymentsCourseInput, PaymentsUserInput, LiqpayCallbackPayload } from "./schema";
