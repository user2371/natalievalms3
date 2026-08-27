import { randomInt } from "crypto";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

/**
 * `lib/auth/verificationCode.ts` — Фаза FIXES, задача F.26
 * (підтвердження email кодом перед реєстрацією).
 *
 * 6-значний цифровий код — `crypto.randomInt` (криптографічно стійкий
 * ГВЧ, той самий рівень обережності, що вже для токенів), НЕ
 * `Math.random()`. Код ніколи не зберігається у відкритому вигляді —
 * хешується/звіряється через `hashPassword`/`verifyPassword`
 * (`lib/auth/password.ts`, той самий bcrypt, що й для паролів; окремий
 * алгоритм хешування заради 6 цифр був би зайвою сутністю).
 */

export const CODE_TTL_MINUTES = 15;
export const MAX_CODE_ATTEMPTS = 5;

/** Генерує новий 6-значний код (рядок з провідними нулями, якщо є). */
export function generateVerificationCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Хешує код для збереження в `PendingRegistration.codeHash`. */
export async function hashVerificationCode(code: string): Promise<string> {
  return hashPassword(code);
}

/** Звіряє введений код з хешем. */
export async function verifyVerificationCode(
  code: string,
  hash: string,
): Promise<boolean> {
  return verifyPassword(code, hash);
}

/** `expiresAt` для нового/оновленого коду — зараз + TTL. */
export function computeCodeExpiry(): Date {
  return new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
}
