import { z } from "zod";

/**
 * `modules/comments/schema.ts` (задача 6.5.1).
 *
 * Той самий підхід, що й у `modules/quizzes/schema.ts`: Zod-схеми для
 * вхідних даних server actions + окремі TS-інтерфейси для форми, яку
 * повертають `repository`/`service` (дзеркалять моделі Prisma
 * `Comment`/`CommentReaction`, з уже підвантаженими даними автора та
 * агрегованими лайками/дизлайками — задача 6.5.2).
 */

export const CreateCommentSchema = z.object({
  lessonId: z.string().min(1, "Не вказано ID уроку"),
  content: z
    .string()
    .trim()
    .min(1, "Коментар не може бути порожнім")
    .max(2000, "Коментар занадто довгий (максимум 2000 символів)"),
});

export const DeleteCommentSchema = z.object({
  id: z.string().min(1, "Не вказано ID коментаря"),
});

/**
 * Реакція лайк/дизлайк на коментар (задача 6.5.24) — модель `CommentReaction`
 * уже є в Prisma-схемі (задача 6.5.22, `type: "LIKE" | "DISLIKE"`,
 * `@@unique([commentId, userId])`).
 */
export const ReactToCommentSchema = z.object({
  commentId: z.string().min(1, "Не вказано ID коментаря"),
  type: z.enum(["LIKE", "DISLIKE"]),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type DeleteCommentInput = z.infer<typeof DeleteCommentSchema>;
export type ReactToCommentInput = z.infer<typeof ReactToCommentSchema>;

/** Автор коментаря — лише поля, потрібні для відображення (не весь `User`). */
export interface CommentAuthor {
  id: string;
  firstName: string;
  lastName: string | null;
  nickname: string | null;
  avatarUrl: string | null;
  role: string;
}

/** Форма коментаря, яку повертає `repository`/`service` (дзеркалить модель Prisma `Comment`). */
export interface Comment {
  id: string;
  lessonId: string;
  userId: string;
  content: string;
  createdAt: Date;
  author: CommentAuthor;
  likes: number;
  dislikes: number;
}
