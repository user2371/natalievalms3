import {
  CreateCommentInput,
  CreateCommentSchema,
  DeleteCommentInput,
  DeleteCommentSchema,
  ReactToCommentInput,
  ReactToCommentSchema,
} from "./schema";
import * as repository from "./repository";

/**
 * `modules/comments/service.ts` (задача 6.5.3) — бізнес-логіка та
 * валідація поверх `repository.ts`, той самий поділ, що й у
 * `modules/quizzes/service.ts`.
 */

export async function getCommentsByLessonIdService(lessonId: string) {
  return repository.findByLessonId(lessonId);
}

export async function listAllCommentsService(options?: {
  courseId?: string;
  lessonId?: string;
}) {
  return repository.findAllComments(options);
}

/**
 * Задача 6.5.3: валідація довжини/непорожності контенту — `content`
 * тримується (`.trim()`) і має бути непорожнім, максимум 2000 символів
 * (`CreateCommentSchema`, задача 6.5.1). Створення прив'язане до
 * конкретного `userId` (з сесії — перевірка авторизації в `actions.ts`,
 * задача 6.5.4, той самий принцип, що й у `modules/quizzes/actions.ts`:
 * service не знає про сесію, лише отримує вже перевірений `userId`).
 *
 * F.25.4: якщо `parentId` заданий — перевіряємо, що батьківський коментар
 * існує і належить ТОМУ Ж `lessonId`, що й новий коментар (захист від
 * підстановки чужого `commentId` з іншого уроку через прямий виклик дії,
 * той самий принцип "не тільки в UI", що вже в `deleteCommentService`).
 *
 * Глибина вкладеності обмежена одним рівнем (рішення з F.25.10.1, поки
 * дефолтне): якщо батьківський коментар сам є відповіддю
 * (`parent.parentId !== null`), новий коментар "спрощується" до кореня —
 * записується з `parentId = parent.parentId`, а не `parent.id`, щоб гілки
 * лишались рівно одного рівня глибини.
 */
export async function addCommentService(userId: string, input: CreateCommentInput) {
  const parsed = CreateCommentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані коментаря");
  }

  let parentId: string | null = parsed.data.parentId ?? null;

  if (parentId) {
    const parent = await repository.findById(parentId);
    if (!parent) {
      throw new Error("Батьківський коментар не знайдено");
    }
    if (parent.lessonId !== parsed.data.lessonId) {
      throw new Error("Батьківський коментар належить іншому уроку");
    }

    parentId = parent.parentId !== null ? parent.parentId : parent.id;
  }

  return repository.create({
    lessonId: parsed.data.lessonId,
    userId,
    content: parsed.data.content,
    parentId,
  });
}

/**
 * Задача 6.5.5 (частина логіки авторизації): видалити коментар може лише
 * admin або автор коментаря — перевіряється тут, а не лише в actions.ts,
 * той самий принцип "не тільки в UI" з `CLAUDE.md`, що й у
 * `modules/quizzes/actions.ts` (`assertAdmin`).
 */
export async function deleteCommentService(
  requesterId: string,
  requesterRole: string,
  input: DeleteCommentInput,
) {
  const parsed = DeleteCommentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректний ID коментаря");
  }

  const comment = await repository.findById(parsed.data.id);
  if (!comment) {
    throw new Error("Коментар не знайдено");
  }

  const isAuthor = comment.userId === requesterId;
  const isAdmin = requesterRole === "ADMIN";
  if (!isAuthor && !isAdmin) {
    throw new Error("Доступ заборонено: можна видаляти лише власні коментарі");
  }

  await repository.deleteById(parsed.data.id);
  return comment;
}

export interface ReactToCommentResult {
  myReaction: "LIKE" | "DISLIKE" | null;
  likes: number;
  dislikes: number;
}

/**
 * Задача 6.5.24: `reactToComment` — якщо реакція вже існує з ТИМ САМИМ
 * типом, знімає її (toggle-off, `deleteReaction`); якщо з ІНШИМ типом —
 * перемикає (`upsertReaction`, один запис на пару `commentId`+`userId`
 * завдяки `@@unique` у Prisma-схемі); якщо реакції ще нема — створює.
 * Повертає актуальну реакцію користувача й перераховані лічильники — той
 * самий "джерело правди після мутації" підхід, що й `submitQuizResultService`.
 */
export async function reactToCommentService(
  userId: string,
  input: ReactToCommentInput,
): Promise<ReactToCommentResult> {
  const parsed = ReactToCommentSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Некоректні дані реакції");
  }

  const comment = await repository.findById(parsed.data.commentId);
  if (!comment) {
    throw new Error("Коментар не знайдено");
  }

  const existing = await repository.findReaction(parsed.data.commentId, userId);

  let myReaction: "LIKE" | "DISLIKE" | null;
  if (existing && existing.type === parsed.data.type) {
    await repository.deleteReaction(parsed.data.commentId, userId);
    myReaction = null;
  } else {
    await repository.upsertReaction(parsed.data.commentId, userId, parsed.data.type);
    myReaction = parsed.data.type;
  }

  const counts = await repository.countReactions(parsed.data.commentId);
  return { myReaction, ...counts };
}
