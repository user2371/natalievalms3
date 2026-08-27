import { Resend } from "resend";
import { CODE_TTL_MINUTES } from "@/lib/auth/verificationCode";

/**
 * `lib/email/registrationVerificationMail.ts` — Фаза FIXES, задача F.26.
 *
 * Тонка обгортка над Resend, той самий принцип/клієнт, що вже в
 * `lib/email/passwordResetMail.ts`/`emailChangeMail.ts` — але лист
 * містить сам КОД текстом (не посилання/кнопку): користувач вводить
 * його вручну на екрані підтвердження (`VerifyEmailScreen.tsx`), тому
 * тут навмисно немає `confirmUrl`/`<a href>`.
 *
 * ⚠️ Той самий sandbox-нюанс Resend free-плану без верифікованого
 * власного домену, що задокументований для `passwordResetMail.ts`/
 * `emailChangeMail.ts`: листи реально доходять лише на адресу, якою
 * зареєстровано Resend-акаунт.
 *
 * F.26.10 (27.08.2026), dev-заглушка на час, поки не куплено й не
 * верифіковано власний домен у Resend: у `NODE_ENV !== "production"`
 * збій відправки НЕ кидає помилку — код замість цього просто друкується
 * в консоль сервера (`console.log`), і флоу (`requestRegistrationService`)
 * продовжується так, ніби лист пішов — можна реєструвати тестових
 * юзерів на БУДЬ-ЯКУ адресу й підтверджувати код, підглянутий у
 * терміналі. У проді (`NODE_ENV === "production"`) поведінка НЕ
 * змінилась — збій, як і раніше, кидає помилку. Це навмисно "м'яка"
 * заглушка на рівні відправки листа, а не вимкнення самого функціоналу
 * підтвердження коду (`PendingRegistration`, лічильник спроб,
 * `verifyRegistrationCodeService` тощо лишаються активними й
 * незмінними) — щойно з'явиться верифікований домен, ця заглушка стає
 * непотрібною сама собою (Resend просто перестане повертати помилку).
 */

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Надсилає лист із 6-значним кодом підтвердження email при реєстрації.
 * У проді кидає звичайний `Error` при збої Resend — той самий підхід,
 * що вже в `sendPasswordResetEmail`/`sendEmailChangeConfirmation`:
 * `requestRegistrationService`/`resendRegistrationCodeService` ловлять
 * і перетворюють на дружнє повідомлення. У розробці (F.26.10, див. вище)
 * збій лише логується — код друкується в консоль, щоб можна було
 * тестувати без верифікованого домену Resend.
 */
export async function sendRegistrationVerificationEmail(
  email: string,
  code: string,
): Promise<void> {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Код підтвердження email — Natalieva LMS",
    html: `
      <p>Дякуємо за реєстрацію в Natalieva LMS!</p>
      <p>Щоб підтвердити свій email і завершити реєстрацію, введіть цей код на сторінці підтвердження:</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>Код дійсний ${CODE_TTL_MINUTES} хвилин. Якщо ви не реєструвались у Natalieva LMS — просто проігноруйте цей лист.</p>
    `,
  });

  if (error) {
    if (!IS_PRODUCTION) {
      // F.26.10: dev-заглушка — Resend sandbox без верифікованого
      // домену не шле на довільні адреси, тож у розробці просто
      // друкуємо код у консоль сервера й НЕ кидаємо помилку.
      console.log(
        `[F.26 dev] Resend не зміг надіслати лист на ${email} (${error.message ?? "невідома помилка"}). ` +
          `Код підтвердження: ${code}`,
      );
      return;
    }
    throw new Error("Не вдалося надіслати лист з кодом. Спробуйте пізніше.");
  }
}
