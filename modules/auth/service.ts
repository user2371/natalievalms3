import {
  RegisterInput,
  RegisterSchema,
  ResetPasswordInput,
  VerifyRegistrationInput,
} from "./schema";
import * as repository from "./repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth/passwordResetToken";
import { sendPasswordResetEmail } from "@/lib/email/passwordResetMail";
import {
  generateVerificationCode,
  hashVerificationCode,
  verifyVerificationCode,
  computeCodeExpiry,
  MAX_CODE_ATTEMPTS,
} from "@/lib/auth/verificationCode";
import { sendRegistrationVerificationEmail } from "@/lib/email/registrationVerificationMail";
import { signPostRegistrationToken } from "@/lib/auth/postRegistrationToken";

/**
 * Фаза FIXES, задача F.26 (підтвердження email кодом перед
 * реєстрацією). Крок 1: замінює колишній `registerUserService`, який
 * одразу писав реального `User`. Тепер — та сама перевірка "юзер із
 * таким email вже існує" на старті, але замість `repository.createUser`
 * пишеться/оновлюється `PendingRegistration` (F.26.5,
 * `upsertPendingRegistration` — перезаписує попередній незавершений
 * запит з тим самим email, якщо він був) і надсилається лист з кодом.
 * Реальний `User` тут БІЛЬШЕ НЕ створюється — це робить лише
 * `verifyRegistrationCodeService` нижче, після підтвердження коду.
 */
export async function requestRegistrationService(input: RegisterInput) {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані реєстрації");
  }

  const existing = await repository.findUserByEmail(parsed.data.email);
  if (existing) {
    throw new Error("Користувач із таким email вже існує");
  }

  const hashedPassword = await hashPassword(parsed.data.password);
  const code = generateVerificationCode();
  const codeHash = await hashVerificationCode(code);

  await repository.upsertPendingRegistration({
    email: parsed.data.email,
    passwordHash: hashedPassword,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    codeHash,
    expiresAt: computeCodeExpiry(),
  });

  await sendRegistrationVerificationEmail(parsed.data.email, code);
}

/**
 * Крок 2: викликається після вводу коду з листа. Перевіряє
 * `PendingRegistration` за email — відсутність запису чи протермінований
 * `expiresAt` дають зрозумілу помилку ("запросіть новий код"), розбіжний
 * код — збільшує `attempts` (F.26.5) і повертає помилку з кількістю
 * спроб, що лишились; після `MAX_CODE_ATTEMPTS` код вважається
 * "спаленим" — потрібен новий через `resendRegistrationCodeService`.
 * При збігу — створює реального `User` (той самий `repository.createUser`,
 * що й раніше в `registerUserService`, з полями з `PendingRegistration`),
 * видаляє сам `PendingRegistration` і повертає короткоживучий токен
 * авто-логіну (`signPostRegistrationToken`, `lib/auth/
 * postRegistrationToken.ts`) — саме він, а не пароль, іде у фінальний
 * `signIn` в `actions.ts` (рішення по F.26.9.1: пароль ніколи не
 * прокидається назад від клієнта на цьому кроці).
 */
export async function verifyRegistrationCodeService(
  input: VerifyRegistrationInput,
): Promise<{ signInToken: string }> {
  const pending = await repository.findPendingRegistrationByEmail(input.email);
  if (!pending) {
    throw new Error(
      "Запит на реєстрацію не знайдено або вже завершено. Зареєструйтесь ще раз.",
    );
  }

  if (pending.expiresAt.getTime() < Date.now()) {
    throw new Error("Код застарів. Натисніть «Надіслати код ще раз».");
  }

  if (pending.attempts >= MAX_CODE_ATTEMPTS) {
    throw new Error(
      "Забагато невдалих спроб. Натисніть «Надіслати код ще раз», щоб отримати новий код.",
    );
  }

  const isValid = await verifyVerificationCode(input.code, pending.codeHash);
  if (!isValid) {
    await repository.incrementPendingRegistrationAttempts(input.email);
    const attemptsLeft = MAX_CODE_ATTEMPTS - (pending.attempts + 1);
    throw new Error(
      attemptsLeft > 0
        ? `Невірний код. Спроб залишилось: ${attemptsLeft}.`
        : "Невірний код. Спроби вичерпано — натисніть «Надіслати код ще раз».",
    );
  }

  const user = await repository.createUser({
    email: pending.email,
    passwordHash: pending.passwordHash,
    firstName: pending.firstName,
    lastName: pending.lastName || undefined,
  });

  await repository.deletePendingRegistration(pending.email);

  const signInToken = await signPostRegistrationToken({ userId: user.id });
  return { signInToken };
}

/**
 * Кнопка "Надіслати код ще раз". Throttle (окремий кулдаун,
 * `lib/auth/rateLimit.ts::isResendCodeRateLimited`) перевіряється в
 * `actions.ts`, до виклику цього сервісу. Якщо `PendingRegistration`
 * з таким email не існує (протух і вже видалений після успішної
 * верифікації, чи взагалі не було) — тиха відмова без деталей, той
 * самий принцип анти-enumeration, що вже в `requestPasswordResetService`.
 */
export async function resendRegistrationCodeService(email: string): Promise<void> {
  const pending = await repository.findPendingRegistrationByEmail(email);
  if (!pending) return;

  const code = generateVerificationCode();
  const codeHash = await hashVerificationCode(code);
  await repository.refreshPendingRegistrationCode(email, codeHash, computeCodeExpiry());

  await sendRegistrationVerificationEmail(pending.email, code);
}

export async function validateUserCredentials(email: string, password: string) {
  const user = await repository.findUserByEmail(email);
  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

/**
 * Фаза FIXES, задача F.20 ("Забув пароль" при логіні — посилання
 * "Забули пароль?" у `LoginScreen.tsx` було статичним `href="#"`, без
 * жодної логіки). Крок 1 флоу: користувач вводить email, отримує лист
 * із посиланням на скидання (`sendPasswordResetEmail`, той самий
 * Resend-принцип, що вже в `sendEmailChangeConfirmation`, 3+.2.3).
 *
 * НАВМИСНО НЕ кидає помилку й НЕ повідомляє виклику, чи знайдено
 * користувача з таким email — класичний захист від email-enumeration
 * (інакше форма скидання пароля стала б способом перевірити, які email
 * зареєстровані в системі). Лист надсилається, лише якщо користувач
 * реально існує; у БУДЬ-ЯКОМУ разі (знайдено/не знайдено) виклик у
 * `actions.ts` показує той самий нейтральний текст успіху.
 */
export async function requestPasswordResetService(email: string): Promise<void> {
  const user = await repository.findUserByEmail(email);
  if (!user) return;

  const token = await signPasswordResetToken({ userId: user.id });
  await sendPasswordResetEmail(user.email, token);
}

/**
 * Крок 2 флоу — викликається переходом за посиланням із листа й
 * заповненням форми нового пароля. Перевіряє підпис/термін дії/
 * призначення токена (`verifyPasswordResetToken`, кидає `Error` сам при
 * недійсному токені — той самий підхід, що `verifyEmailChangeToken`),
 * хешує новий пароль (`hashPassword`, той самий helper, що і в
 * реєстрації/зміні пароля) і записує через
 * `repository.updatePasswordHash`.
 *
 * НАВМИСНО без перевірки поточного пароля (на відміну від
 * `changePasswordService` у `modules/account`) — сенс усього флоу саме
 * в тому, що користувач НЕ пам'ятає поточний пароль; підписаний токен,
 * підтверджений володінням поштовою скринькою, є єдиним і достатнім
 * доказом права на зміну.
 */
export async function resetPasswordService(input: ResetPasswordInput): Promise<void> {
  const payload = await verifyPasswordResetToken(input.token);
  const newHash = await hashPassword(input.newPassword);
  await repository.updatePasswordHash(payload.userId, newHash);
}
