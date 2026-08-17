import { prisma } from "@/lib/prisma";
import type { UserItem } from "./schema";

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  nickname: true,
  role: true,
  roleChangedByLabel: true,
  roleChangedAt: true,
  createdAt: true,
} as const;

export async function findAllUsers(): Promise<UserItem[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: USER_SELECT,
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: USER_SELECT,
  });
}

/**
 * ADMIN+.1 (09.08.2026): `actorLabel` — текстовий знімок "Ім'я (email)"
 * адміна, який виконує зміну (сформований у `service.ts`), записується
 * разом з роллю в тій самій операції — `roleChangedAt` виставляється тут
 * (`new Date()`), а не на боці сервісу, щоб час запису точно збігався з
 * фактичним моментом запису в БД.
 */
export async function updateUserRole(
  userId: string,
  role: string,
  actorLabel: string,
): Promise<UserItem> {
  return prisma.user.update({
    where: { id: userId },
    data: { role, roleChangedByLabel: actorLabel, roleChangedAt: new Date() },
    select: USER_SELECT,
  });
}
