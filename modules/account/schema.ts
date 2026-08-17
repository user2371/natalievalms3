import { z } from "zod";

/**
 * `modules/account/schema.ts` — Фаза 3+, задача 3+.1.2 (перша частина
 * нового модуля `modules/account`, рішення про його існування окремо
 * від `modules/profile` — `TASKS_DETAILED.md`, 3+.0.1: тут приватні,
 * чутливі до безпеки дії власника акаунта — фото/email/пароль, кожна з
 * яких згодом (3+.2/3+.3) вимагатиме підтвердження поточним паролем, на
 * відміну від публічного `modules/profile`).
 *
 * Константи для валідації файлу аватарки (3+.1) + `ChangePasswordSchema`
 * (задача 3+.3.1, 05.08.2026) — `email`-схема (3+.2) додасться окремо,
 * ще не реалізована.
 */

/**
 * ОНОВЛЕНО 08.08.2026 (ФАЗА IMG+, задача IMG+.2.2) — розширено до трьох
 * форматів (`webp` додано); `AVATAR_MAX_SIZE_BYTES` лишається 5MB, той
 * самий ліміт, що вже в підказці UI на `/settings` ("JPG, PNG або WebP,
 * максимум 5MB") — навмисно окремий, менший за ліміт сертифікатів
 * (10MB, `TASKS_DETAILED.md`, CERT+.0.4): портрет обличчя не потребує
 * такого ж запасу, як фото паперового документа.
 */
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const AVATAR_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type AvatarAllowedMimeType = (typeof AVATAR_ALLOWED_MIME_TYPES)[number];

/**
 * Задача 3+.3.1. `min(6)` — та сама межа, що й у `RegisterSchema`
 * (`modules/auth/schema.ts`), для узгодженості правил паролю в проєкті.
 * Перевірка "новий пароль ≠ старий" — НЕ тут (це порівняння з хешем у
 * БД, а не між двома полями форми), а в `service.ts` (3+.3.2), той самий
 * поділ, що вже прийнятий у проєкті: `schema.ts` — форма/поля, `service.ts`
 * — бізнес-правила, що потребують звернення до БД.
 */
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Введіть поточний пароль"),
    newPassword: z.string().min(6, "Пароль має містити мінімум 6 символів"),
    repeatPassword: z.string().min(1, "Підтвердження паролю обов’язкове"),
  })
  .refine((data) => data.newPassword === data.repeatPassword, {
    message: "Паролі повинні збігатися",
    path: ["repeatPassword"],
  });

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/**
 * Задача 3+.2.1. `currentPassword` — той самий принцип, що в
 * `ChangePasswordSchema` вище: будь-яка чутлива дія акаунта (3+.0.1)
 * підтверджується поточним паролем. Унікальність `newEmail` — НЕ тут
 * (потребує звернення до БД), а в `service.ts` (3+.2.2), той самий
 * поділ, що вже в `changePasswordService`.
 */
export const ChangeEmailSchema = z.object({
  newEmail: z.string().email("Некоректний формат email"),
  currentPassword: z.string().min(1, "Введіть поточний пароль"),
});

export type ChangeEmailInput = z.infer<typeof ChangeEmailSchema>;

/**
 * Задача F.24 (09.08.2026, IMG+.3.6) — реальне видалення акаунта. Той
 * самий принцип, що `ChangePasswordSchema`/`ChangeEmailSchema` вище:
 * найдеструктивніша з чутливих дій акаунта (безповоротна, каскадно
 * стирає ВСІ дані користувача) обов'язково підтверджується поточним
 * паролем — навіть суворіше, ніж зміна email/пароля, бо тут немає що
 * "відкликати" після факту.
 */
export const DeleteAccountSchema = z.object({
  currentPassword: z.string().min(1, "Введіть поточний пароль"),
});

export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
