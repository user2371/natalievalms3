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
