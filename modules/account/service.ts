import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { signEmailChangeToken, verifyEmailChangeToken } from "@/lib/account/emailChangeToken";
import { sendEmailChangeConfirmation } from "@/lib/email/emailChangeMail";
import { deleteAvatar } from "@/lib/storage/avatarStorage";
import { deleteCertificateImage } from "@/lib/storage/certificateStorage";
import { findUploadedImagePublicIdsForUser } from "@/modules/certificates/repository";
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_SIZE_BYTES,
  type ChangeEmailInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from "./schema";
import * as repository from "./repository";

/**
 * `modules/account/service.ts` — Фаза 3+, задача 3+.1.2.
 *
 * Серверна валідація файлу аватарки — ПЕРЕД `saveAvatar`
 * (`lib/storage/avatarStorage.ts`, задача 3+.1.1, уже реалізована).
 * Навмисно окремо від самого сховища: `avatarStorage.ts` відповідає
 * лише "як зберегти", цей модуль — "чи можна зберігати" (той самий
 * поділ відповідальності, що в решті проєкту — напр. валідація
 * контенту коментаря в `modules/comments/service.ts`, а не в
 * `repository.ts`).
 *
 * Перевіряє те саме, що вже написано підказкою в UI на `/settings`
 * ("JPG, PNG або WebP, максимум 5MB") — але тут це РЕАЛЬНА перевірка на
 * сервері, а не лише напис: атрибут `accept=` на `<input type="file">`
 * (задача 3+.1.4) — лише зручність у браузері, його легко обійти
 * (напр. перейменувати файл), тому клієнтській валідації тут НІКОЛИ не
 * довіряємо.
 *
 * ОНОВЛЕНО 08.08.2026 (ФАЗА IMG+, задача IMG+.2.1): ця функція й далі
 * лишається БЕЗ зміни логіки (розмір + заявлений `file.type`), але це
 * лише ПЕРШИЙ, дешевий UX-шар — швидка відмова ще до читання файлу в
 * буфер, без CPU-витрат на Sharp. Її легко обійти (підроблений
 * `Content-Type`/перейменований файл) — РЕАЛЬна перевірка вмісту файлу
 * (сніфінг справжнього формату, захист від decompression bomb) —
 * `processUploadedImage` (`lib/images/processUploadedImage.ts`,
 * IMG+.1), викликається в `saveAvatar` нижче
 * (`lib/storage/avatarStorage.ts`).
 */
export function validateAvatarFile(file: File): void {
  if (file.size === 0) {
    throw new Error("Файл порожній");
  }

  if (
    !AVATAR_ALLOWED_MIME_TYPES.includes(
      file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number],
    )
  ) {
    throw new Error("Дозволені лише зображення у форматі JPG, PNG або WebP");
  }

  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    throw new Error("Розмір файлу перевищує 5MB");
  }
}

/**
 * Задача 3+.3.2. Перевіряє `currentPassword` проти реального хеша в БД
 * (`verifyPassword`, `lib/auth/password.ts` — той самий, що вже
 * використовується в `modules/auth/service.ts` для логіну), забороняє
 * новий пароль == старому (додаткова перевірка, якої немає в реєстрації,
 * бо там немає "старого" пароля для порівняння), хешує новий
 * (`hashPassword`) і записує через `repository.updatePasswordHash`.
 *
 * Кидає звичайний `Error` з українським повідомленням при невалідних
 * умовах — той самий підхід, що й `validateAvatarFile` вище:
 * `actions.ts` (3+.3.3) ловить і перетворює на `{ success: false, error }`.
 */
export async function changePasswordService(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const currentHash = await repository.getPasswordHash(userId);
  if (!currentHash) {
    throw new Error("Не вдалося перевірити поточний пароль");
  }

  const isCurrentValid = await verifyPassword(input.currentPassword, currentHash);
  if (!isCurrentValid) {
    throw new Error("Поточний пароль невірний");
  }

  const isSameAsOld = await verifyPassword(input.newPassword, currentHash);
  if (isSameAsOld) {
    throw new Error("Новий пароль має відрізнятися від поточного");
  }

  const newHash = await hashPassword(input.newPassword);
  await repository.updatePasswordHash(userId, newHash);
}

/**
 * Задача 3+.2.2. Перевіряє `currentPassword` (той самий `verifyPassword`,
 * що в `changePasswordService` вище), забороняє `newEmail` == поточному
 * (`repository.getEmail`), перевіряє унікальність `newEmail`
 * (`repository.findUserByEmail` — не єдиний захист, `User.email`
 * лишається `@unique` в Prisma-схемі, це лише дружніше повідомлення про
 * помилку, ніж сирий constraint-error, якби колізію ловила лише БД).
 *
 * НЕ записує новий email одразу — email у БД лишається старим до
 * переходу за посиланням (`confirmEmailChangeService` нижче, 3+.2.3).
 * Замість запису: підписує токен (`lib/account/emailChangeToken.ts`) і
 * надсилає лист через Resend (`lib/email/emailChangeMail.ts`) на НОВУ
 * адресу.
 */
export async function changeEmailService(
  userId: string,
  input: ChangeEmailInput,
): Promise<void> {
  const currentHash = await repository.getPasswordHash(userId);
  if (!currentHash) {
    throw new Error("Не вдалося перевірити поточний пароль");
  }

  const isCurrentValid = await verifyPassword(input.currentPassword, currentHash);
  if (!isCurrentValid) {
    throw new Error("Поточний пароль невірний");
  }

  const currentEmail = await repository.getEmail(userId);
  if (currentEmail && currentEmail.toLowerCase() === input.newEmail.toLowerCase()) {
    throw new Error("Новий email збігається з поточним");
  }

  const existing = await repository.findUserByEmail(input.newEmail);
  if (existing) {
    throw new Error("Цей email уже використовується іншим акаунтом");
  }

  const token = await signEmailChangeToken({ userId, newEmail: input.newEmail });
  await sendEmailChangeConfirmation(input.newEmail, token);
}

/**
 * Задача 3+.2.3, друга половина флоу — викликається переходом за
 * посиланням із листа (`confirmEmailChangeAction`). Перевіряє підпис і
 * термін дії токена (`verifyEmailChangeToken`, кидає `Error` сам при
 * недійсному/протермінованому токені), ПОВТОРНО перевіряє унікальність
 * `newEmail` (могла змінитись за ~30 хв, доки токен був чинний — напр.
 * інший користувач встиг зайняти ту саму адресу) і лише тоді записує
 * `User.email`. Повертає новий email — потрібен виклику
 * `useSession().update({ email })` на клієнті (3+.2.6).
 */
export async function confirmEmailChangeService(token: string): Promise<string> {
  const payload = await verifyEmailChangeToken(token);

  const existing = await repository.findUserByEmail(payload.newEmail);
  if (existing && existing.id !== payload.userId) {
    throw new Error("Цей email уже використовується іншим акаунтом");
  }

  await repository.updateEmail(payload.userId, payload.newEmail);
  return payload.newEmail;
}

/**
 * Задача F.24 (09.08.2026, реалізує відкладений IMG+.3.6). Реальне,
 * безповоротне видалення акаунта — раніше кнопка "Видалити акаунт" на
 * `/settings` (F.7) лише викликала `signOut()` без жодного видалення
 * рядка `User`. Той самий принцип підтвердження, що вже в
 * `changePasswordService`/`changeEmailService` вище — `verifyPassword`
 * проти реального хеша, а не просто довіра до того, що людина вже
 * залогінена (сесія могла лишитись відкритою на чужому пристрої).
 *
 * Порядок дій (навмисний — Cloudinary ПЕРЕД Postgres):
 * 1. Перевірка `currentPassword`.
 * 2. Зібрати `avatarUrl` (`repository.getAvatarUrl`) і `public_id`-и
 *    ВСІХ завантажених сертифікатів
 *    (`findUploadedImagePublicIdsForUser`, `modules/certificates/
 *    repository.ts`) — ЗАЗДАЛЕГІДЬ, поки рядок `User` (і каскадно
 *    пов'язані `Certificate`) ще існує в БД.
 * 3. Видалити відповідні файли з Cloudinary (`deleteAvatar`/
 *    `deleteCertificateImage`) — **best-effort**: помилка окремого
 *    виклику (мережа/Cloudinary тимчасово недоступний) НЕ блокує
 *    видалення акаунта — людина, що явно попросила видалити акаунт,
 *    не повинна застрягти через збій стороннього сервісу; ігнорована
 *    помилка тут означає лише "сирітський файл лишиться в Cloudinary
 *    трохи довше", не "акаунт неможливо видалити". Той самий
 *    компроміс, що вже прийнятий для orphan-cleanup при ЗАВАНТАЖЕННІ
 *    (IMG+.2.4/IMG+.3.4), лише дзеркально для видалення.
 * 4. `repository.deleteUserById` — сам рядок `User`; `onDelete:
 *    Cascade` у `prisma/schema.prisma` прибирає решту (курси-записи,
 *    прогрес, коментарі/реакції, бали, здані домашні завдання,
 *    сертифікати) одним запитом.
 *
 * Сесію (JWT, `signOut()`) закриває клієнт (`app/settings/page.tsx`)
 * ПІСЛЯ успішної відповіді цієї дії — той самий порядок, що вже F.7
 * робив (лише тепер услід за реальним видаленням, а не замість нього).
 */
export async function deleteAccountService(
  userId: string,
  input: DeleteAccountInput,
): Promise<void> {
  const currentHash = await repository.getPasswordHash(userId);
  if (!currentHash) {
    throw new Error("Не вдалося перевірити поточний пароль");
  }

  const isCurrentValid = await verifyPassword(input.currentPassword, currentHash);
  if (!isCurrentValid) {
    throw new Error("Поточний пароль невірний");
  }

  const [avatarUrl, certificatePublicIds] = await Promise.all([
    repository.getAvatarUrl(userId),
    findUploadedImagePublicIdsForUser(userId),
  ]);

  if (avatarUrl) {
    try {
      await deleteAvatar(userId);
    } catch {
      // best-effort — див. docblock вище
    }
  }

  for (const publicId of certificatePublicIds) {
    try {
      await deleteCertificateImage(publicId);
    } catch {
      // best-effort — див. docblock вище
    }
  }

  await repository.deleteUserById(userId);
}
