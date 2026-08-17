import { RegisterInput, RegisterSchema, ResetPasswordInput } from "./schema";
import * as repository from "./repository";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  signPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/auth/passwordResetToken";
import { sendPasswordResetEmail } from "@/lib/email/passwordResetMail";

export async function registerUserService(input: RegisterInput) {
  const parsed = RegisterSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані реєстрації");
  }

  const existing = await repository.findUserByEmail(parsed.data.email);
  if (existing) {
    throw new Error("Користувач із таким email вже існує");
  }

  const hashedPassword = await hashPassword(parsed.data.password);

  const user = await repository.createUser({
    email: parsed.data.email,
    passwordHash: hashedPassword,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
  });

  return user;
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
