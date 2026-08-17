import { z } from "zod";

export const UserRoleSchema = z.enum(["USER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UpdateUserRoleSchema = z.object({
  userId: z.string().min(1, "ID користувача обов'язковий"),
  role: UserRoleSchema,
});
export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>;

export interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  role: string;
  /** ADMIN+.1: знімок "Ім'я (email)" адміна, який останнім змінив роль, або `null`. */
  roleChangedByLabel: string | null;
  /** ADMIN+.1: коли відбулась остання зміна ролі, або `null`. */
  roleChangedAt: Date | null;
  createdAt: Date;
}
