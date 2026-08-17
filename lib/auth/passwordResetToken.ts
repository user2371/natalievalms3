import { SignJWT, jwtVerify } from "jose";

/**
 * `lib/auth/passwordResetToken.ts` — Фаза FIXES, задача F.20 ("Забув
 * пароль" при логіні).
 *
 * Той самий stateless-підхід, що вже є в проєкті для зміни email
 * (`lib/account/emailChangeToken.ts`, задача 3+.2.3): підписаний JWT
 * (`jose`, `SignJWT`/`jwtVerify`), без нової Prisma-моделі — весь стан
 * живе в самому токені (payload: `userId`, `purpose`, `exp` ~30 хв).
 * Навмисно ОКРЕМИЙ файл/функції від `emailChangeToken.ts`, а не
 * перевикористання того самого підпису — різне призначення токена
 * (payload там: `newEmail`, тут — жодного email, лише `userId`), і
 * важливо, щоб токен скидання пароля НЕ можна було випадково
 * підсунути туди, де очікується токен зміни email (чи навпаки) —
 * поле `purpose: "password-reset"` у payload є додатковим бар'єром: навіть
 * якби хтось спробував "згодувати" токен не того типу, `verifyPasswordResetToken`
 * явно перевіряє `purpose` і відхилить його.
 *
 * Підписується на той самий `AUTH_SECRET`, що й `emailChangeToken.ts` —
 * той самий свідомий компроміс "один секрет замість декількох",
 * задокументований там-таки.
 */

const PASSWORD_RESET_TOKEN_TTL = "30m";
const PASSWORD_RESET_PURPOSE = "password-reset";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET не налаштовано");
  }
  return new TextEncoder().encode(secret);
}

export interface PasswordResetTokenPayload {
  userId: string;
}

/** Підписує токен скидання пароля, дійсний ~30 хвилин. */
export async function signPasswordResetToken(
  payload: PasswordResetTokenPayload,
): Promise<string> {
  return new SignJWT({ userId: payload.userId, purpose: PASSWORD_RESET_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(PASSWORD_RESET_TOKEN_TTL)
    .sign(getSecretKey());
}

/**
 * Перевіряє підпис, термін дії та `purpose` токена, повертає payload.
 * Кидає `Error` з українським повідомленням при недійсному/
 * протермінованому/чужому за призначенням токені (перехоплюється в
 * `resetPasswordAction`) — той самий підхід, що й
 * `verifyEmailChangeToken`.
 */
export async function verifyPasswordResetToken(
  token: string,
): Promise<PasswordResetTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const { userId, purpose } = payload as { userId?: unknown; purpose?: unknown };
    if (typeof userId !== "string" || purpose !== PASSWORD_RESET_PURPOSE) {
      throw new Error("Недійсний токен скидання пароля");
    }
    return { userId };
  } catch {
    throw new Error(
      "Посилання для скидання пароля недійсне або застаріло. Запросіть нове.",
    );
  }
}
