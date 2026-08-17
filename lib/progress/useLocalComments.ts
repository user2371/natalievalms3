"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { lessonCommentsSet, reactionsSet } from "@/lib/store/slices/commentsSlice";
import {
  CURRENT_USER_AVATAR_URL,
  CURRENT_USER_ID,
  CURRENT_USER_NAME,
  getDemoComments,
  type Comment,
} from "@/lib/data/comments";
import {
  addLocalComment,
  deleteLocalComment,
  getLocalComments,
  getLocalReactions,
  toggleLocalReaction,
  type Reaction,
} from "@/lib/progress/localComments";

export interface CommentWithReaction extends Comment {
  /** Власна реакція поточного (демо-)користувача на цей коментар, якщо є. */
  myReaction: Reaction | null;
  /** Чи може поточний користувач видалити цей коментар (автор або адмін). */
  canDelete: boolean;
  /** Видаляється не як автор, а за адмінським правом (задача 0.17) — для іншого підпису/aria-label кнопки. */
  deletableAsAdmin: boolean;
}

/**
 * Хук для читання/додавання коментарів під уроком і лайк/дизлайк-реакцій.
 *
 * 23.07.2026: перенесено на Redux Toolkit (`lib/store/slices/commentsSlice.ts`)
 * — власні коментарі читають і `CommentsBlock`, і `CommentCard`, реакції ж
 * взагалі глобальні (не прив'язані до одного уроку). Зовнішній API хука
 * (`{ comments, addComment, deleteComment, react }`) не змінився.
 *
 * @param isAdmin Чи має поточний відвідувач право видаляти будь-чий
 * коментар (задача 0.17, `DEMO_PROFILE.role === "ADMIN"` — див.
 * `lib/data/profile.ts` і `CLAUDE.md`). За замовчуванням `false`.
 *
 * Реальне server-side збереження (`modules/comments`) — Фаза 3+.
 */
export function useLocalComments(lessonSlug: string, isAdmin = false) {
  const dispatch = useAppDispatch();
  const localComments = useAppSelector(
    (state) => state.comments.commentsByLesson[lessonSlug] ?? [],
  );
  const lessonHydrated = useAppSelector(
    (state) => state.comments.hydratedLessons[lessonSlug] ?? false,
  );
  const reactions = useAppSelector((state) => state.comments.reactions);
  const reactionsHydrated = useAppSelector((state) => state.comments.reactionsHydrated);

  useEffect(() => {
    if (!lessonHydrated) {
      dispatch(lessonCommentsSet({ lessonSlug, comments: getLocalComments(lessonSlug) }));
    }
    if (!reactionsHydrated) {
      dispatch(reactionsSet(getLocalReactions()));
    }
  }, [lessonSlug, lessonHydrated, reactionsHydrated, dispatch]);

  const addComment = useCallback(
    (text: string) => {
      const next = addLocalComment(lessonSlug, {
        id: `local-${Date.now()}`,
        authorId: CURRENT_USER_ID,
        authorName: CURRENT_USER_NAME,
        authorAvatarUrl: CURRENT_USER_AVATAR_URL,
        text,
      });
      dispatch(lessonCommentsSet({ lessonSlug, comments: next }));
    },
    [lessonSlug, dispatch],
  );

  const deleteComment = useCallback(
    (commentId: string) => {
      dispatch(
        lessonCommentsSet({
          lessonSlug,
          comments: deleteLocalComment(lessonSlug, commentId),
        }),
      );
    },
    [lessonSlug, dispatch],
  );

  const react = useCallback(
    (commentId: string, reaction: Reaction) => {
      dispatch(reactionsSet(toggleLocalReaction(commentId, reaction)));
    },
    [dispatch],
  );

  const baseComments = [...localComments, ...getDemoComments(lessonSlug)];

  const comments: CommentWithReaction[] = baseComments.map((comment) => {
    const myReaction = reactions[comment.id] ?? null;
    const isOwn = comment.authorId === CURRENT_USER_ID;
    return {
      ...comment,
      likes: comment.likes + (myReaction === "like" ? 1 : 0),
      dislikes: comment.dislikes + (myReaction === "dislike" ? 1 : 0),
      myReaction,
      canDelete: isOwn || isAdmin,
      deletableAsAdmin: !isOwn && isAdmin,
    };
  });

  return { comments, addComment, deleteComment, react };
}
