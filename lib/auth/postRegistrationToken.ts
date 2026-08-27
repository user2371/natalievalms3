import { SignJWT, jwtVerify } from "jose";

/**
 * `lib/auth/postRegistrationToken.ts` — Фаза FIXES, задача F.26.
 *
 * Розв'язання відкритого питання F.26.9.1 (з плану в `TASKS_DETAILED.md`):
 * після успішної перевірки коду підтвердження реальний `User`
 * створюється в `verifyRegistrationCodeService`, і його одразу треба
 * авто-логінити — а `CredentialsProvider.authorize()` (`auth.ts`)
 * типово перевіряє пароль. Best practice тут — НЕ тримати пароль у
 * відкритому вигляді в клієнтському React-стані модалки між кроком
 * реєстрації й кроком вводу коду (зайве вікно ризику: пароль живе в
 * пам'яті довше, ніж потрібно, і мусить прокидатись через ще один
 * server action). Замість цього — сервер сам видає короткоживучий
 * (2 хв) підписаний JWT одразу після того, як реально підтвердив
 * володіння поштою (успішний код) і створив `User`; цей токен
 * передається в `signIn("credentials", { registrationToken, ... })`
 * (`auth.ts`, `authorize()` — окрема гілка від email+password). Той
 * самий stateless-підхід (`jose`, `SignJWT`/`jwtVerify`), що вже в
 * `passwordResetToken.ts`/`emailChangeToken.ts`, з тим самим
 * бар'єром-призначенням `purpose`, щоб токен цього типу не можна було
 * підсунути туди, де очікується токен скидання пароля чи навпаки.
 */

const POST_REGISTRATION_TOKEN_TTL = "2m";
const POST_REGISTRATION_PURPOSE = "post-registration-signin";

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET не налаштовано");
  }
  return new TextEncoder().encode(secret);
}

export interface PostRegistrationTokenPayload {
  userId: string;
}

/** Підписує токен авто-логіну одразу після підтвердження email, дійсний ~2 хвилини. */
export async function signPostRegistrationToken(
  payload: PostRegistrationTokenPayload,
): Promise<string> {
  return new SignJWT({ userId: payload.userId, purpose: POST_REGISTRATION_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(POST_REGISTRATION_TOKEN_TTL)
    .sign(getSecretKey());
}

/**
 * Перевіряє підпис/термін дії/`purpose` токена — викликається лише
 * зсередини `authorize()` (`auth.ts`), одразу після видачі, тож
 * недійсний/протермінований токен тут означає лише зіпсований клієнтський
 * виклик (не показується користувачу як окреме повідомлення) — `authorize()`
 * просто повертає `null` (як і при невірному паролі).
 */
export async function verifyPostRegistrationToken(
  token: string,
): Promise<PostRegistrationTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const { userId, purpose } = payload as { userId?: unknown; purpose?: unknown };
    if (typeof userId !== "string" || purpose !== POST_REGISTRATION_PURPOSE) {
      return null;
    }
    return { userId };
  } catch {
    return null;
  }
}
