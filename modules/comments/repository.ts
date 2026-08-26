import { prisma } from "@/lib/prisma";
import type { Comment } from "./schema";

/**
 * `modules/comments/repository.ts` (задача 6.5.2) — лише прямі запити до
 * Prisma, без бізнес-логіки (валідація довжини/непорожності — у
 * `service.ts`), той самий поділ, що й у `modules/quizzes/repository.ts`.
 */

const AUTHOR_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  nickname: true,
  avatarUrl: true,
  role: true,
} as const;

/** Приводить результат Prisma-запиту (з `_count` реакцій за типом) у форму `Comment` (задача 6.5.1). */
function mapComment(raw: {
  id: string;
  lessonId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    nickname: string | null;
    avatarUrl: string | null;
    role: string;
  };
  reactions: { type: string }[];
}): Comment {
  return {
    id: raw.id,
    lessonId: raw.lessonId,
    userId: raw.userId,
    parentId: raw.parentId,
    content: raw.content,
    createdAt: raw.createdAt,
    author: raw.user,
    likes: raw.reactions.filter((reaction) => reaction.type === "LIKE").length,
    dislikes: raw.reactions.filter((reaction) => reaction.type === "DISLIKE").length,
  };
}

/**
 * Усі коментарі під уроком, з даними автора та агрегованими
 * лайками/дизлайками (порахованими з `CommentReaction`, задача 6.5.22+ —
 * модель уже є в Prisma-схемі, тут лише читання). Сортування (найновіші
 * зверху, задача 6.5.14) і пагінація (6.5.15) — за межами 6.5.1–6.5.5,
 * поки що звичайний порядок створення.
 */
export async function findByLessonId(lessonId: string): Promise<Comment[]> {
  const rows = await prisma.comment.findMany({
    where: { lessonId },
    include: {
      user: { select: AUTHOR_SELECT },
      reactions: { select: { type: true } },
    },
  });

  return rows.map(mapComment);
}

export interface AdminCommentItem extends Comment {
  lessonTitle: string;
}

export async function findAllComments(options?: {
  courseId?: string;
  lessonId?: string;
}): Promise<AdminCommentItem[]> {
  const where: { lessonId?: string; lesson?: { courseId?: string } } = {};
  if (options?.lessonId) {
    where.lessonId = options.lessonId;
  } else if (options?.courseId) {
    where.lesson = { courseId: options.courseId };
  }

  const rows = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: AUTHOR_SELECT },
      reactions: { select: { type: true } },
      lesson: { select: { title: true } },
    },
  });

  return rows.map((raw) => ({
    ...mapComment(raw),
    lessonTitle: raw.lesson.title,
  }));
}

export interface CreateCommentData {
  lessonId: string;
  userId: string;
  content: string;
  parentId: string | null;
}

export async function create(data: CreateCommentData): Promise<Comment> {
  const row = await prisma.comment.create({
    data: {
      lessonId: data.lessonId,
      userId: data.userId,
      content: data.content,
      parentId: data.parentId,
    },
    include: {
      user: { select: AUTHOR_SELECT },
      reactions: { select: { type: true } },
    },
  });

  return mapComment(row);
}

/**
 * Лише для перевірки авторства/існування перед видаленням (задача 6.5.5) —
 * без зайвих include. `parentId` додано в F.25.4: потрібен, щоб
 * `addCommentService` перевірив, чи батьківський коментар сам є
 * відповіддю (спрощення глибини вкладеності до одного рівня).
 */
export async function findById(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    select: { id: true, userId: true, lessonId: true, parentId: true },
  });
}

export async function deleteById(id: string): Promise<void> {
  await prisma.comment.delete({ where: { id } });
}

/**
 * Реакції лайк/дизлайк (задача 6.5.23) — над `CommentReaction`
 * (Prisma-модель уже є, задача 6.5.22, `@@unique([commentId, userId])`
 * дає складений ключ `commentId_userId`, той самий підхід, що й
 * `Progress.userId_lessonId` у `modules/quizzes/repository.ts`).
 */

/** Поточна реакція `userId` на цей коментар (чи є вона взагалі) — для toggle-логіки в `service.ts`. */
export async function findReaction(commentId: string, userId: string) {
  return prisma.commentReaction.findUnique({
    where: { commentId_userId: { commentId, userId } },
  });
}

/** Створює реакцію або перемикає тип наявної (лайк ⇄ дизлайк) — не викликати для "зняти реакцію", див. `deleteReaction`. */
export async function upsertReaction(commentId: string, userId: string, type: string) {
  return prisma.commentReaction.upsert({
    where: { commentId_userId: { commentId, userId } },
    create: { commentId, userId, type },
    update: { type },
  });
}

export async function deleteReaction(commentId: string, userId: string): Promise<void> {
  await prisma.commentReaction.delete({
    where: { commentId_userId: { commentId, userId } },
  });
}

export interface ReactionCounts {
  likes: number;
  dislikes: number;
}

/** Підрахунок likes/dislikes по коментарю (для повернення оновлених лічильників після реакції, задача 6.5.24). */
export async function countReactions(commentId: string): Promise<ReactionCounts> {
  const reactions: { type: string }[] = await prisma.commentReaction.findMany({
    where: { commentId },
    select: { type: true },
  });

  return {
    likes: reactions.filter((reaction) => reaction.type === "LIKE").length,
    dislikes: reactions.filter((reaction) => reaction.type === "DISLIKE").length,
  };
}
