"use server";

import { ZodError } from "zod";
import { cookies } from "next/headers";
import { signIn, signOut } from "@/auth";
import { registerUserService, requestPasswordResetService, resetPasswordService } from "./service";
import {
  LoginInput,
  RegisterInput,
  LoginSchema,
  RegisterSchema,
  ForgotPasswordInput,
  ForgotPasswordSchema,
  ResetPasswordInput,
  ResetPasswordSchema,
} from "./schema";
import { AuthError } from "next-auth";
import {
  isLoginRateLimited,
  recordFailedLoginAttempt,
  clearLoginAttempts,
  isPasswordResetRateLimited,
  recordPasswordResetRequest,
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

export async function registerUserAction(input: RegisterInput) {
  try {
    const validated = RegisterSchema.parse(input);
    await registerUserService(validated);

    await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    });

    return { success: true, error: null };
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return { success: false, error: "Помилка авто-входу після реєстрації" };
    }
    const message = err instanceof Error ? err.message : "Не вдалося зареєструватися";
    return { success: false, error: message };
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
      // Тимчасове діагностичне логування (F.20+, дебаг CredentialsSignin
      // на /lessons/[slug]): `err.type` тут — офіційна категорія Auth.js
      // ("CredentialsSignin" і т.д.), але `authorize()` у `auth.ts` може
      // кинути й ІНШУ помилку (напр. збій Prisma/БД), яку Auth.js теж
      // іноді загортає в `CredentialsSignin` — без логу справжню причину
      // видно лише тут, у `err.cause`, а не в повідомленні, яке бачить
      // користувач.
      console.error("[loginUserAction] AuthError:", err.type, err.cause ?? err);
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
