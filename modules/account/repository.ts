import { prisma } from "@/lib/prisma";

/**
 * `modules/account/repository.ts` — Фаза 3+, задача 3+.1.3 (перший файл
 * `repository.ts` цього модуля — рішення 3+.0.1 вже фіксувало, що він
 * з'явиться разом із першою підзадачею, якій реально потрібен, той
 * самий інкрементальний підхід, що вже застосовувався в
 * `modules/comments`).
 *
 * Лише прямі запити до Prisma, без бізнес-логіки (валідація файлу —
 * `service.ts`, задача 3+.1.2, уже реалізована; перевірка сесії/пароля —
 * `actions.ts`/майбутній `service.ts` для 3+.2/3+.3) — той самий поділ,
 * що й у решті модулів проєкту.
 */

/**
 * Записує новий `avatarUrl` (`saveAvatar`, `lib/storage/avatarStorage.ts`)
 * або скидає на `null` (видалення фото, `removeAvatarAction`).
 */
export async function updateAvatarUrl(
  userId: string,
  avatarUrl: string | null,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });
}

/**
 * Задача 3+.3.2 — читає лише `passwordHash` (не весь `User`), потрібен
 * `changePasswordService` для перевірки поточного пароля
 * (`verifyPassword`, `lib/auth/password.ts`). `String | null`, а не
 * гарантований `String` — той самий тип поля, що в `prisma/schema.prisma`
 * (`passwordHash String?`, допускає обліковки без пароля, якщо колись
 * з'явиться OAuth-провайдер поза `credentials`); `changePasswordService`
 * трактує `null` як неможливість перевірити поточний пароль і повертає
 * помилку, а не падає.
 */
export async function getPasswordHash(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  return user?.passwordHash ?? null;
}

/** Записує новий хеш пароля (вже хешований `hashPassword`, не сирий текст). */
export async function updatePasswordHash(
  userId: string,
  passwordHash: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

/**
 * Задача 3+.2.2 — перевірка унікальності `newEmail` ПЕРЕД надсиланням
 * листа підтвердження (без сенсу турбувати Resend, якщо email уже
 * зайнятий іншим користувачем). `User.email` лишається `@unique` в
 * Prisma-схемі (задача 1.x) — цей запит не єдиний захист (сама БД
 * все одно відхилить дублікат на рівні `update` нижче), а швидка й
 * дружня до користувача перевірка з конкретним повідомленням "email
 * уже зайнятий", а не сирий Prisma constraint error.
 */
export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

/** Поточний email користувача — для порівняння "новий != старий" у 3+.2.2. */
export async function getEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  return user?.email ?? null;
}

/**
 * Задача 3+.2.3 — записує НОВИЙ email лише після підтвердження токена
 * (`confirmEmailChangeAction`), не одразу в `changeEmailService`
 * (3+.2.2 лише перевіряє пароль/унікальність і надсилає лист — email у
 * БД до переходу за посиланням лишається старим).
 */
export async function updateEmail(userId: string, email: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { email },
  });
}

/**
 * Задача F.24 (09.08.2026, IMG+.3.6) — читає лише `avatarUrl`, потрібен
 * `deleteAccountService` ПЕРЕД видаленням рядка `User`, щоб знати, чи
 * взагалі є що чистити в Cloudinary (`avatarUrl === null` — аватарки
 * ніколи не було, викликати `deleteAvatar` не має сенсу).
 */
export async function getAvatarUrl(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });
  return user?.avatarUrl ?? null;
}

/**
 * Задача F.24 (09.08.2026) — остаточне видалення рядка `User`.
 * `onDelete: Cascade` на КОЖНОМУ зв'язку в `prisma/schema.prisma`
 * (`Enrollment`/`Progress`/`Comment`/`CommentReaction`/`PointsLedger`/
 * `HomeworkSubmission`/`Certificate`) означає, що Postgres сам прибирає
 * всі похідні рядки одним запитом — тут НЕ потрібна ручна транзакція з
 * послідовних `deleteMany`, той самий підхід, що вже неявно покладався
 * на каскад у схемі (задача 1.x). Cloudinary-очищення (аватарка й
 * завантажені сертифікати) відбувається ОКРЕМО, ДО цього виклику —
 * `deleteAccountService` (`modules/account/service.ts`), бо після
 * видалення рядка `User` (і каскадного видалення `Certificate`)
 * `imagePublicId`-и вже ніде взяти.
 */
export async function deleteUserById(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
