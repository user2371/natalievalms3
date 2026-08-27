import { prisma } from "@/lib/prisma";

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string;
  nickname?: string;
  role?: string;
}

/**
 * Фаза FIXES, задача F.20 ("Забув пароль"). Той самий запис, що вже
 * робить `modules/account/repository.ts` для зміни пароля залогіненого
 * користувача (`updatePasswordHash`) — тут окрема копія в
 * `modules/auth`, бо скидання пароля навмисно НЕ вимагає активної сесії
 * (див. `resetPasswordService`), тож логічно належить модулю `auth`
 * (анонімні дії до входу), а не `account` (дії вже залогіненого
 * користувача) — той самий поділ, що вже існує між
 * `lib/auth/rateLimit.ts` (email-ключ, до сесії) і
 * `lib/account/rateLimit.ts` (userId-ключ, після сесії).
 */
export async function updatePasswordHash(userId: string, passwordHash: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
}

export async function createUser(data: CreateUserData) {
  const nickname =
    data.nickname ||
    `@${data.firstName.toLowerCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName || null,
      nickname,
      role: data.role || "USER",
    },
  });
}

/**
 * Фаза FIXES, задача F.26 (підтвердження email кодом перед
 * реєстрацією). CRUD для `PendingRegistration` — незавершена
 * реєстрація, поки код не підтверджено (реального `User` ще нема).
 */
export interface PendingRegistrationData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName?: string;
  codeHash: string;
  expiresAt: Date;
}

export async function findPendingRegistrationByEmail(email: string) {
  return prisma.pendingRegistration.findUnique({
    where: { email: email.toLowerCase() },
  });
}

/**
 * Створює новий запис або повністю перезаписує попередній незавершений
 * запит з тим самим email (типовий кейс: лист не дійшов, чи людина
 * передумала й реєструється повторно) — новий пароль/код/`expiresAt`,
 * лічильник `attempts` завжди скидається на 0.
 */
export async function upsertPendingRegistration(data: PendingRegistrationData) {
  const email = data.email.toLowerCase();
  return prisma.pendingRegistration.upsert({
    where: { email },
    create: {
      email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName || null,
      codeHash: data.codeHash,
      expiresAt: data.expiresAt,
    },
    update: {
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName || null,
      codeHash: data.codeHash,
      expiresAt: data.expiresAt,
      attempts: 0,
    },
  });
}

/** Оновлює лише код/термін дії й скидає лічильник спроб — для "Надіслати ще раз". */
export async function refreshPendingRegistrationCode(
  email: string,
  codeHash: string,
  expiresAt: Date,
) {
  return prisma.pendingRegistration.update({
    where: { email: email.toLowerCase() },
    data: { codeHash, expiresAt, attempts: 0 },
  });
}

export async function incrementPendingRegistrationAttempts(email: string) {
  return prisma.pendingRegistration.update({
    where: { email: email.toLowerCase() },
    data: { attempts: { increment: 1 } },
  });
}

export async function deletePendingRegistration(email: string) {
  return prisma.pendingRegistration.delete({
    where: { email: email.toLowerCase() },
  });
}
