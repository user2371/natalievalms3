"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { CommentForm } from "@/components/lesson/CommentForm";
import { GuestCommentBanner } from "@/components/lesson/GuestCommentBanner";
import { CommentCard } from "@/components/lesson/CommentCard";
import { AdminConfirmDeleteModal } from "@/components/admin/AdminConfirmDeleteModal";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import {
  addCommentAction,
  deleteCommentAction,
  reactToCommentAction,
} from "@/modules/comments";
import type { Comment } from "@/modules/comments";
import type { CommentWithReaction } from "@/lib/progress/useLocalComments";
import type { Reaction } from "@/lib/progress/localComments";

export interface RealCommentsBlockProps {
  lessonId: string;
  /** Коментарі, завантажені на сервері (`getCommentsByLessonIdService`, задача 6.5.7). */
  initialComments: Comment[];
  className?: string;
}

/** Скільки коментарів показувати одразу, до кліку "Показати ще" (той самий крок, що й у `CommentsBlock`). */
const VISIBLE_STEP = 5;

/**
 * Задача 9.14 ("Обробка помилок мережі"): окреме повідомлення для випадку,
 * коли сам виклик server action не дійшов до сервера (обірваний зв'язок,
 * офлайн), на відміну від серверної відповіді `{ success: false, error }`
 * (там причина конкретна — невалідні дані, не знайдено запис тощо). Єдиний
 * текст на всі три дії цього компонента (додати/видалити/реакція) — сама дія
 * зрозуміла з контексту (яке саме поле підсвічує помилку), тому не потрібно
 * повторювати назву дії в тексті.
 */
const NETWORK_ERROR_MESSAGE = "Проблема з мережею. Перевір з'єднання і спробуй ще раз.";

function authorDisplayName(author: Comment["author"]): string {
  if (author.nickname) return author.nickname;
  return `${author.firstName}${author.lastName ? ` ${author.lastName}` : ""}`;
}

/**
 * Адаптує реальний (Prisma) `Comment` (`modules/comments/schema.ts`) у
 * форму `CommentWithReaction`, яку вже очікують `CommentCard`/
 * `CommentLikeButtons` (той самий адаптер-принцип, що вже застосований у
 * `modules/quizzes/service.ts` для `QuizQuestion[]`, перевикористані без
 * змін). `myReaction` (задача 6.5.25/26) — з локального стану
 * `RealCommentsBlock` (`myReactions`), яким керує `handleReact`; сервер
 * не повертає початкову реакцію користувача разом зі списком коментарів
 * (`findByLessonId`, задача 6.5.2, не чіпали), тож до першого кліку по
 * лайку/дизлайку в цій сесії кнопки не підсвічені, навіть якщо
 * користувач реагував раніше, — задокументоване обмеження, за межі
 * задач 6.5.23–6.5.26 не виходили.
 */
function toCardComment(
  comment: Comment,
  currentUserId: string | undefined,
  isAdmin: boolean,
  myReaction: Reaction | null,
): CommentWithReaction {
  const isOwn = comment.userId === currentUserId;
  return {
    id: comment.id,
    lessonSlug: comment.lessonId,
    authorId: comment.author.id,
    authorName: authorDisplayName(comment.author),
    authorAvatarUrl: comment.author.avatarUrl,
    createdAt:
      comment.createdAt instanceof Date
        ? comment.createdAt.toISOString()
        : comment.createdAt,
    text: comment.content,
    likes: comment.likes,
    dislikes: comment.dislikes,
    myReaction,
    canDelete: isOwn || isAdmin,
    deletableAsAdmin: !isOwn && isAdmin,
  };
}

/**
 * Обгортка над `CommentsBlock`-компонентами (`CommentForm`/
 * `GuestCommentBanner`/`CommentCard`, ПЕРЕВИКОРИСТАНІ без змін) — для
 * реальних (Prisma) уроків, `/courses/[slug]/lessons/[lessonId]`.
 *
 * - **6.5.7**: список коментарів приходить з сервера (`initialComments`,
 *   `getCommentsByLessonIdService` викликається на сторінці-споживачі),
 *   далі керується локальним `useState` для optimistic-оновлень.
 * - **6.5.8/6.5.9**: `CommentForm` підключена до `addCommentAction` —
 *   коментар додається в список ОДРАЗУ (тимчасовий `optimistic-*` id, ще
 *   до відповіді сервера), форма й так очищається одразу (поведінка
 *   `CommentForm`, не чіпали).
 * - **6.5.10**: якщо `addCommentAction` повертає помилку — тимчасовий
 *   запис прибирається зі списку (rollback) і текст помилки показується
 *   під формою.
 * - **6.5.11**: гість бачить `GuestCommentBanner` замість форми (клік —
 *   `openAuthModal("login")`), той самий компонент, що й у `CommentsBlock`.
 * - **6.5.12**: кнопка видалення — `comment.canDelete` (`CommentCard`,
 *   не чіпали) — правда для автора коментаря АБО admin (`session.user.role`),
 *   те саме правило, що вже перевіряється на сервері в
 *   `deleteCommentService` (задача 6.5.5).
 * - **6.5.13**: клік на видалення відкриває `AdminConfirmDeleteModal`
 *   (перевикористана з адмінки), підтвердження викликає `deleteCommentAction`
 *   з optimistic-видаленням зі списку і відкатом при помилці.
 * - **6.5.14**: список сортується найновішими зверху (`createdAt` спадаюче)
 *   перед рендером — і серверні, і щойно додані optimistic-коментарі.
 * - **6.5.15**: "Показати ще" — той самий `visibleCount`-патерн, що вже в
 *   `CommentsBlock` (крок {VISIBLE_STEP}).
 * - **6.5.22**: `CommentReaction` — Prisma-модель уже була в схемі (нічого
 *   не додавали).
 * - **6.5.23/6.5.24**: лайк/дизлайк — `handleReact` викликає
 *   `reactToCommentAction`, яка на сервері перемикає (toggle) реакцію
 *   (`modules/comments/service.ts`, `reactToCommentService`).
 * - **6.5.25**: кнопки лайк/дизлайк (`CommentLikeButtons`, всередині
 *   `CommentCard`, не чіпали) підключені до `handleReact`; для гостя клік
 *   вже сам `CommentCard` перенаправляє на `onRequireLogin` (не
 *   `onReact`) — `reactToCommentAction` для гостя взагалі не викликається.
 * - **6.5.26**: лічильники likes/dislikes і підсвітка кнопки міняються
 *   ОДРАЗУ (оптимістично, до відповіді сервера), з відкатом при помилці.
 */
export function RealCommentsBlock({
  lessonId,
  initialComments,
  className,
}: RealCommentsBlockProps) {
  const { data: session, status } = useSession();
  const { openAuthModal } = useAuthModal();

  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [myReactions, setMyReactions] = useState<Record<string, Reaction | null>>({});
  const [reactionError, setReactionError] = useState<string | null>(null);
  // Задача 9.13 ("перевірка станів кнопок"): захист від повторного кліку по
  // лайк/дизлайк, поки попередній запит ще в польоті (той самий commentId —
  // друга кнопка тієї ж пари теж блокується, бо вони взаємовиключні).
  const [pendingReactionId, setPendingReactionId] = useState<string | null>(null);

  const loggedIn = status === "authenticated";
  const currentUserId = session?.user?.id;
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const sortedComments = [...comments].sort((a, b) => {
    const aTime =
      a.createdAt instanceof Date ? a.createdAt.getTime() : Date.parse(a.createdAt);
    const bTime =
      b.createdAt instanceof Date ? b.createdAt.getTime() : Date.parse(b.createdAt);
    return bTime - aTime;
  });
  const visibleComments = sortedComments.slice(0, visibleCount);
  const remaining = sortedComments.length - visibleComments.length;

  async function handleAddComment(text: string) {
    if (!session?.user?.id) return;
    setFormError(null);

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment: Comment = {
      id: optimisticId,
      lessonId,
      userId: session.user.id,
      content: text,
      createdAt: new Date(),
      author: {
        id: session.user.id,
        firstName: session.user.name ?? "",
        lastName: null,
        nickname: (session.user as { nickname?: string }).nickname ?? null,
        avatarUrl: (session.user as { avatarUrl?: string }).avatarUrl ?? null,
        role: isAdmin ? "ADMIN" : "USER",
      },
      likes: 0,
      dislikes: 0,
    };

    setComments((prev) => [optimisticComment, ...prev]);

    try {
      const result = await addCommentAction({ lessonId, content: text });
      if (result.success && result.comment) {
        const savedComment = result.comment;
        setComments((prev) =>
          prev.map((comment) => (comment.id === optimisticId ? savedComment : comment)),
        );
      } else {
        setComments((prev) => prev.filter((comment) => comment.id !== optimisticId));
        setFormError(result.error ?? "Не вдалося додати коментар");
      }
    } catch {
      // Задача 9.14: мережевий збій (не серверна відповідь з `success: false`,
      // а сам виклик action не дійшов) — той самий відкат оптимістичного
      // стану, що й для звичайної серверної помилки, плюс окреме повідомлення,
      // щоб не плутати з "невалідний текст коментаря".
      setComments((prev) => prev.filter((comment) => comment.id !== optimisticId));
      setFormError(NETWORK_ERROR_MESSAGE);
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    const snapshot = comments;

    setPendingDeleteId(null);
    setDeleteError(null);
    setComments((prev) => prev.filter((comment) => comment.id !== id));

    try {
      const result = await deleteCommentAction({ id });
      if (!result.success) {
        setComments(snapshot);
        setDeleteError(result.error ?? "Не вдалося видалити коментар");
      }
    } catch {
      setComments(snapshot);
      setDeleteError(NETWORK_ERROR_MESSAGE);
    }
  }

  /**
   * Задача 6.5.25/6.5.26: лайк/дизлайк з optimistic UI. Той самий toggle-принцип,
   * що й на сервері (`reactToCommentService`) — рахуємо локально ЩО МАЄ СТАТИСЯ
   * (та сама реакція → зняти; інша → перемкнути) і одразу оновлюємо лічильники
   * та підсвітку кнопки, ще до відповіді сервера; після відповіді — синхронізуємось
   * з реальним станом (`result.myReaction`/`likes`/`dislikes`), а при помилці —
   * відкат до знімку `before`.
   */
  async function handleReact(commentId: string, reaction: Reaction) {
    if (pendingReactionId === commentId) return;

    const targetComment = comments.find((comment) => comment.id === commentId);
    if (!targetComment) return;

    const type = reaction === "like" ? "LIKE" : "DISLIKE";
    const previousMyReaction = myReactions[commentId] ?? null;
    const previousLikes = targetComment.likes;
    const previousDislikes = targetComment.dislikes;

    let nextMyReaction: Reaction | null;
    let nextLikes = previousLikes;
    let nextDislikes = previousDislikes;

    if (previousMyReaction === reaction) {
      nextMyReaction = null;
      if (reaction === "like") nextLikes -= 1;
      else nextDislikes -= 1;
    } else {
      nextMyReaction = reaction;
      if (reaction === "like") {
        nextLikes += 1;
        if (previousMyReaction === "dislike") nextDislikes -= 1;
      } else {
        nextDislikes += 1;
        if (previousMyReaction === "like") nextLikes -= 1;
      }
    }

    setReactionError(null);
    setPendingReactionId(commentId);
    setMyReactions((prev) => ({ ...prev, [commentId]: nextMyReaction }));
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, likes: nextLikes, dislikes: nextDislikes }
          : comment,
      ),
    );

    try {
      const result = await reactToCommentAction({ commentId, type });
      if (result.success) {
        const syncedReaction: Reaction | null =
          result.myReaction === "LIKE"
            ? "like"
            : result.myReaction === "DISLIKE"
              ? "dislike"
              : null;
        setMyReactions((prev) => ({ ...prev, [commentId]: syncedReaction }));
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? { ...comment, likes: result.likes, dislikes: result.dislikes }
              : comment,
          ),
        );
      } else {
        setMyReactions((prev) => ({ ...prev, [commentId]: previousMyReaction }));
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? { ...comment, likes: previousLikes, dislikes: previousDislikes }
              : comment,
          ),
        );
        setReactionError(result.error ?? "Не вдалося зберегти реакцію");
      }
    } catch {
      setMyReactions((prev) => ({ ...prev, [commentId]: previousMyReaction }));
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === commentId
            ? { ...comment, likes: previousLikes, dislikes: previousDislikes }
            : comment,
        ),
      );
      setReactionError(NETWORK_ERROR_MESSAGE);
    } finally {
      setPendingReactionId(null);
    }
  }

  return (
    <Card padding="lg" className={className}>
      <h2 className="font-serif text-xl text-ink">Коментарі ({comments.length})</h2>

      <div className="mt-4 border-b border-rose-line/30 pb-5">
        {loggedIn ? (
          <>
            <CommentForm onSubmit={handleAddComment} />
            {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
          </>
        ) : (
          <GuestCommentBanner onLoginClick={() => openAuthModal("login")} />
        )}
      </div>

      {deleteError && <p className="mt-3 text-sm text-danger">{deleteError}</p>}
      {reactionError && <p className="mt-3 text-sm text-danger">{reactionError}</p>}

      {sortedComments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          Поки що немає коментарів. Будьте першим!
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-5">
            {visibleComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={toCardComment(
                  comment,
                  currentUserId,
                  isAdmin,
                  myReactions[comment.id] ?? null,
                )}
                loggedIn={loggedIn}
                onReact={handleReact}
                onRequireLogin={() => openAuthModal("login")}
                onDelete={setPendingDeleteId}
                reactionPending={pendingReactionId === comment.id}
              />
            ))}
          </div>

          {remaining > 0 && (
            <div className="mt-5 flex justify-center border-t border-rose-line/30 pt-5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<ChevronDownIcon size={15} />}
                onClick={() => setVisibleCount((prev) => prev + VISIBLE_STEP)}
              >
                Показати ще {remaining} коментарі
              </Button>
            </div>
          )}
        </>
      )}

      <AdminConfirmDeleteModal
        open={pendingDeleteId !== null}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
        entityLabel="коментар"
      />
    </Card>
  );
}
