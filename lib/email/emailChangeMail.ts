import { Resend } from "resend";

/**
 * `lib/email/emailChangeMail.ts` — Фаза 3+, задача 3+.2.3.
 *
 * Тонка обгортка над Resend (3+.0.6) — той самий принцип абстракції, що
 * вже виправдав себе з `lib/storage/avatarStorage.ts` (Cloudinary) і
 * `VideoPlayer`/`provider` (Фаза 4): `modules/account/service.ts` знає
 * лише про `sendEmailChangeConfirmation`, а не про те, що саме за ним
 * стоїть Resend. Модуль лише серверний (`resend` SDK, `RESEND_API_KEY`
 * ніколи не потрапляє в клієнтський код) — імпортувати тільки з server
 * actions/services.
 *
 * ⚠️ Sandbox-обмеження free-плану Resend без верифікованого власного
 * домену (задокументовано в `TASKS_DETAILED.md`, 3+.0.6): листи реально
 * доходять ЛИШЕ на адресу, якою користувач зареєстрував Resend-акаунт.
 * Для будь-якої іншої `newEmail` виклик API технічно відпрацює (або
 * поверне помилку Resend про sandbox-обмеження) без реальної доставки —
 * очікувана поведінка на цьому етапі проєкту, не баг.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Надсилає лист із посиланням підтвердження на НОВУ адресу (не на
 * поточну — сенс перевірки саме в підтвердженні доступу до нової
 * скриньки). Кидає звичайний `Error` при збої Resend — той самий
 * підхід, що вже в `modules/account/service.ts`/`lib/storage/
 * avatarStorage.ts`: `actions.ts` ловить і перетворює на `{ success:
 * false, error }`.
 */
export async function sendEmailChangeConfirmation(
  newEmail: string,
  token: string,
): Promise<void> {
  const confirmUrl = `${APP_URL}/settings/confirm-email?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: newEmail,
    subject: "Підтвердження зміни email — Natalieva LMS",
    html: `
      <p>Ви (або хтось від вашого імені) запросили зміну email на цій адресі в Natalieva LMS.</p>
      <p>Щоб підтвердити зміну, перейдіть за посиланням (дійсне 30 хвилин):</p>
      <p><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p>Якщо ви не робили цей запит — просто проігноруйте цей лист, ваш email не зміниться.</p>
    `,
  });

  if (error) {
    throw new Error("Не вдалося надіслати лист підтвердження. Спробуйте пізніше.");
  }
}
