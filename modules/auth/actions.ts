"use server";

import { ZodError } from "zod";
import { cookies } from "next/headers";
import { signIn, signOut } from "@/auth";
import {
  requestRegistrationService,
  requestPasswordResetService,
  resetPasswordService,
  verifyRegistrationCodeService,
  resendRegistrationCodeService,
} from "./service";
import {
  LoginInput,
  RegisterInput,
  LoginSchema,
  RegisterSchema,
  ForgotPasswordInput,
  ForgotPasswordSchema,
  ResetPasswordInput,
  ResetPasswordSchema,
  VerifyRegistrationInput,
  VerifyRegistrationSchema,
  ResendRegistrationCodeInput,
  ResendRegistrationCodeSchema,
} from "./schema";
import { AuthError } from "next-auth";
import {
  isLoginRateLimited,
  recordFailedLoginAttempt,
  clearLoginAttempts,
  isPasswordResetRateLimited,
  recordPasswordResetRequest,
  isRegistrationRateLimited,
  recordRegistrationRequest,
  isResendCodeRateLimited,
  recordResendCodeRequest,
} from "@/lib/auth/rateLimit";

/**
 * Той самий трюк, що вже в `modules/account/actions.ts`
 * (`formatActionError`, задокументовано там 05.08.2026) — `.parse(...)`
 * зі `zod` кидає `ZodError`, чий `.message` — сирий JSON, а не текст
 * для показу користувачу. Дублюється тут (а не імпортується з
 * `modules/account`) навмисно: модулі `auth`/`account` — окремі
 * зони відповідальності (анонімні дії до сесії / дії залогіненого
 * користувача, той самий поділ, що вже пояснено біля
 * `lib/auth/rateLimit.ts` vs `lib/account/rateLimit.ts`), і не варто
 * створювати між ними імпортну залежність заради однієї маленької
 * функції-форматера.
 */
function formatAuthActionError(err: unknown, fallback: string): string {
  if (err instanceof ZodError) {
    return err.issues[0]?.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

// Ім'я cookie сесії Auth.js v5 (див. `@auth/core/lib/utils/cookie.js`):
// `authjs.session-token`, з префіксом `__Secure-` лише для secure (https)
// кук. Тут секурність визначається так само, як типово в Auth.js — за
// `NODE_ENV`, оскільки в проєкті локальна розробка йде по http.
const IS_SECURE_ENV = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = IS_SECURE_ENV
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";

/**
 * "Запам'ятати мене" (задача 2.15). Базово `authConfig.session.maxAge`
 * (30 днів) вже застосовується до cookie сесії, яку виставляє `signIn` —
 * це поведінка "Запам'ятати мене" увімкнено. Якщо чекбокс НЕ позначений,
 * перезаписуємо ту саму cookie без `maxAge`/`expires`, перетворюючи її на
 * сесійну (браузер видаляє її при закритті вкладки/вікна), значення токена
 * не змінюється.
 */
async function applyRememberMePreference(remember: boolean) {
  if (remember) return;

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!sessionCookie) return;

  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie.value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: IS_SECURE_ENV,
  });
}

/**
 * Фаза FIXES, задача F.26 (підтвердження email кодом перед
 * реєстрацією). Крок 1 — раніше ця дія одразу створювала `User` і
 * логінила; тепер лише запускає `requestRegistrationService`
 * (пише `PendingRegistration`, шле лист з кодом) і повертає успіх БЕЗ
 * сесії. Throttle за email (окремий лічильник, той самий принцип, що
 * вже `isPasswordResetRateLimited`) — щоб форму реєстрації не можна
 * було використати для email-бомбінгу довільної адреси.
 */
export async function registerUserAction(input: RegisterInput) {
  try {
    const validated = RegisterSchema.parse(input);
    const rateLimitKey = validated.email.toLowerCase();

    if (isRegistrationRateLimited(rateLimitKey)) {
      return {
        success: false,
        error: "Забагато запитів реєстрації. Спробуйте ще раз через 15 хвилин.",
      };
    }

    recordRegistrationRequest(rateLimitKey);
    await requestRegistrationService(validated);

    return { success: true, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Не вдалося зареєструватися";
    return { success: false, error: message };
  }
}

/**
 * Крок 2 — виклик з `VerifyEmailScreen.tsx` після вводу коду з листа.
 * `verifyRegistrationCodeService` створює реального `User` лише при
 * правильному коді й повертає короткоживучий `signInToken`
 * (`lib/auth/postRegistrationToken.ts`) — саме він, а не пароль, іде у
 * `signIn` нижче (рішення по відкритому питанню F.26.9.1: пароль ніде
 * не тримається в клієнтському стані між кроками).
 */
export async function verifyRegistrationCodeAction(input: VerifyRegistrationInput) {
  try {
    const validated = VerifyRegistrationSchema.parse(input);
    const { signInToken } = await verifyRegistrationCodeService(validated);

    await signIn("credentials", { registrationToken: signInToken, redirect: false });

    return { success: true as const, error: null };
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return { success: false as const, error: "Помилка авто-входу після підтвердження" };
    }
    const message = formatAuthActionError(err, "Не вдалося підтвердити код");
    return { success: false as const, error: message };
  }
}

/**
 * "Надіслати код ще раз" на екрані підтвердження. Throttle — окремий,
 * короткий (60 сек) кулдаун (`isResendCodeRateLimited`), відмінний від
 * throttle кроку 1 вище — там рахуються самі СПРОБИ РЕЄСТРАЦІЇ (рідкі),
 * тут — саме запити повторного листа (очікувано частіші, але все одно
 * не мають ставати інструментом спаму).
 */
export async function resendRegistrationCodeAction(input: ResendRegistrationCodeInput) {
  try {
    const validated = ResendRegistrationCodeSchema.parse(input);
    const rateLimitKey = validated.email.toLowerCase();

    if (isResendCodeRateLimited(rateLimitKey)) {
      return { success: false as const, error: "Зачекайте трохи перед повторним надсиланням." };
    }

    recordResendCodeRequest(rateLimitKey);
    await resendRegistrationCodeService(validated.email);

    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = formatAuthActionError(err, "Не вдалося надіслати код");
    return { success: false as const, error: message };
  }
}

export async function loginUserAction(input: LoginInput) {
  try {
    const validated = LoginSchema.parse(input);
    const rateLimitKey = validated.email.toLowerCase();

    if (isLoginRateLimited(rateLimitKey)) {
      return {
        success: false,
        error: "Забагато невдалих спроб входу. Спробуйте ще раз за кілька хвилин.",
      };
    }

    await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    });
    await applyRememberMePreference(Boolean(validated.rememberMe));
    clearLoginAttempts(rateLimitKey);

    return { success: true, error: null };
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      const validated = LoginSchema.safeParse(input);
      if (validated.success) {
        recordFailedLoginAttempt(validated.data.email.toLowerCase());
      }
      switch (err.type) {
        case "CredentialsSignin":
          return { success: false, error: "Невірний email або пароль" };
        default:
          return { success: false, error: "Помилка входу у систему" };
      }
    }
    const message = err instanceof Error ? err.message : "Невірний email або пароль";
    return { success: false, error: message };
  }
}

/**
 * Fixes (02.08.2026): цю server action БІЛЬШЕ НЕ використовує жоден
 * клієнтський компонент — `Header.tsx`/`AccountLayout.tsx` перейшли на
 * клієнтський `signOut` з `next-auth/react`. Причина: server action
 * очищує сесію на сервері, але не має способу синхронізувати клієнтський
 * `useSession()` (`SessionProvider`) — кнопка "Вийти" в хедері/сайдбарі
 * візуально нічого не міняла, поки користувач сам не перезавантажував
 * сторінку. Лишено в модулі на випадок, якщо колись знадобиться чистий
 * server-side логаут (напр. з іншого server action, де немає доступу до
 * `next-auth/react`) — але для БУДЬ-ЯКОГО клієнтського компонента з
 * кнопкою "Вийти" правильний вибір — `signOut()` з `next-auth/react`, не
 * ця функція.
 */
export async function logoutUserAction() {
  await signOut({ redirect: false });
  return { success: true };
}

/**
 * `requestPasswordResetAction` — Фаза FIXES, задача F.20. Крок 1
 * ("Забули пароль?" → email → лист"). Throttle за email (окремий
 * лічильник `lib/auth/rateLimit.ts`, ключ той самий формат
 * `email.toLowerCase()`, що вже в `loginUserAction`) — рахує САМІ
 * запити (а не лише невдалі), щоб форма не стала інструментом
 * email-бомбінгу довільної адреси.
 *
 * Завжди повертає однаковий нейтральний `{ success: true }` з тим самим
 * повідомленням незалежно від того, чи існує користувач з таким email —
 * `requestPasswordResetService` сама вирішує, надсилати лист чи ні
 * (захист від email-enumeration, пояснено там). Єдиний випадок
 * `success: false` — вичерпаний ліміт запитів (throttle), не помилка
 * пошуку користувача.
 */
export async function requestPasswordResetAction(input: ForgotPasswordInput) {
  try {
    const validated = ForgotPasswordSchema.parse(input);
    const rateLimitKey = validated.email.toLowerCase();

    if (isPasswordResetRateLimited(rateLimitKey)) {
      return {
        success: false as const,
        error: "Забагато запитів. Спробуйте ще раз через 15 хвилин.",
      };
    }

    recordPasswordResetRequest(rateLimitKey);
    await requestPasswordResetService(validated.email);

    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = formatAuthActionError(err, "Не вдалося надіслати лист");
    return { success: false as const, error: message };
  }
}

/**
 * `resetPasswordAction` — крок 2 (посилання з листа → нова форма
 * пароля). НАВМИСНО без throttle за `userId`/сесією (на відміну від
 * `changePasswordAction` у `modules/account`) — тут узагалі немає
 * активної сесії до завершення дії (той самий випадок, що
 * `confirmEmailChangeAction`, 3+.2.3): сам підписаний токен уже є
 * достатнім і єдиним захистом, а й термін його дії — 30 хв.
 */
export async function resetPasswordAction(input: ResetPasswordInput) {
  try {
    const validated = ResetPasswordSchema.parse(input);
    await resetPasswordService(validated);
    return { success: true as const, error: null };
  } catch (err: unknown) {
    const message = formatAuthActionError(err, "Не вдалося скинути пароль");
    return { success: false as const, error: message };
  }
}
