import { Resend } from "resend";

/**
 * `lib/email/passwordResetMail.ts` — Фаза FIXES, задача F.20.
 *
 * Тонка обгортка над Resend — той самий принцип і той самий клієнт
 * (`resend`, `RESEND_API_KEY`/`RESEND_FROM_EMAIL`/`NEXT_PUBLIC_APP_URL`),
 * що вже в `lib/email/emailChangeMail.ts` (задача 3+.2.3). Модуль лише
 * серверний — імпортувати тільки з server actions/services.
 *
 * ⚠️ Той самий sandbox-нюанс Resend free-плану без верифікованого
 * власного домену, що задокументований для `emailChangeMail.ts`: листи
 * реально доходять лише на адресу, якою зареєстровано Resend-акаунт.
 */

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Надсилає лист із посиланням для скидання пароля. Кидає звичайний
 * `Error` при збої Resend — той самий підхід, що вже в
 * `sendEmailChangeConfirmation`: `requestPasswordResetService` ловить і
 * перетворює на дружнє повідомлення.
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Скидання пароля — Natalieva LMS",
    html: `
      <p>Ви (або хтось від вашого імені) запросили скидання пароля для акаунта на цій адресі в Natalieva LMS.</p>
      <p>Щоб встановити новий пароль, перейдіть за посиланням (дійсне 30 хвилин):</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Якщо ви не робили цей запит — просто проігноруйте цей лист, ваш пароль не зміниться.</p>
    `,
  });

  if (error) {
    throw new Error("Не вдалося надіслати лист. Спробуйте пізніше.");
  }
}
