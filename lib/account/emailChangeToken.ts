import { SignJWT, jwtVerify } from "jose";

/**
 * `lib/account/emailChangeToken.ts` — Фаза 3+, задача 3+.2.3.
 *
 * Підписаний токен підтвердження зміни email — той самий клас підходу,
 * що вже неявно є в проєкті через JWT-сесії Auth.js (Фаза 2), але
 * навмисно ОКРЕМИЙ від сесії: payload/термін життя/призначення зовсім
 * інші (не "хто залогінений", а "хто і на яку саме адресу хоче
 * поміняти email, і чи це підтверджено переходом за посиланням у
 * листі"). Без нової Prisma-моделі — весь стан живе в самому підписаному
 * токені (payload: `userId`, `newEmail`, `exp` ~30 хв), той самий підхід
 * "stateless-токен", що й JWT-сесія.
 *
 * `jose` (`SignJWT`/`jwtVerify`) — той самий пакет, що вже транзитивно
 * тягне `next-auth`, тут пряма залежність (задача 3+.0.7, встановлено
 * 05.08.2026) для власного підпису, не пов'язаного з сесією NextAuth.
 *
 * Підписується на `AUTH_SECRET` (не окремий `EMAIL_CHANGE_SECRET`,
 * хоча план 3+.2.3 згадував обидва варіанти) — навмисно простіше: один
 * секрет менше означає один менше ключ, який треба генерувати/зберігати
 * для персонального/навчального проєкту; компрометація токена зміни
 * email вимагала б того самого секрету, що й компрометація сесії —
 * рівнозначний ризик, не новий клас загрози.
 */

const EMAIL_CHANGE_TOKEN_TTL = "30m";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET не налаштовано");
  }
  return new TextEncoder().encode(secret);
}

export interface EmailChangeTokenPayload {
  userId: string;
  newEmail: string;
}

/** Підписує токен підтвердження зміни email, дійсний ~30 хвилин. */
export async function signEmailChangeToken(
  payload: EmailChangeTokenPayload,
): Promise<string> {
  return new SignJWT({ userId: payload.userId, newEmail: payload.newEmail })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EMAIL_CHANGE_TOKEN_TTL)
    .sign(getSecretKey());
}

/**
 * Перевіряє підпис і термін дії токена, повертає payload. Кидає `Error`
 * при недійсному/протермінованому токені (перехоплюється в
 * `confirmEmailChangeAction`, 3+.2.3) — той самий підхід "кидає Error з
 * українським повідомленням", що вже в `modules/account/service.ts`.
 */
export async function verifyEmailChangeToken(
  token: string,
): Promise<EmailChangeTokenPayload> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const { userId, newEmail } = payload as { userId?: unknown; newEmail?: unknown };
    if (typeof userId !== "string" || typeof newEmail !== "string") {
      throw new Error("Недійсний токен підтвердження");
    }
    return { userId, newEmail };
  } catch {
    throw new Error(
      "Посилання для підтвердження недійсне або застаріло. Спробуйте змінити email ще раз.",
    );
  }
}
