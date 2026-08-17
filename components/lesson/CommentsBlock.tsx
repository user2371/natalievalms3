"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ChevronDownIcon } from "@/components/ui/icons";
import { CommentForm } from "@/components/lesson/CommentForm";
import { GuestCommentBanner } from "@/components/lesson/GuestCommentBanner";
import { CommentCard } from "@/components/lesson/CommentCard";
import { useLocalComments } from "@/lib/progress/useLocalComments";
import { useAuthModal } from "@/components/auth/AuthModalContext";

export interface CommentsBlockProps {
  lessonSlug: string;
  loggedIn: boolean;
  /** Чи може поточний відвідувач видаляти будь-чий коментар (задача 0.17). */
  isAdmin?: boolean;
  className?: string;
}

/** Скільки коментарів показувати одразу, до кліку "Показати ще". */
const VISIBLE_STEP = 5;

/**
 * Блок коментарів під уроком (задача 0.7.20): заголовок "Коментарі (N)" +
 * форма додавання (0.7.21) або банер для гостя (0.7.22) + список карток
 * коментарів (0.7.23) з лайк/дизлайк (0.7.23a) та умовним видаленням
 * (0.7.24, розширено в 0.17 для адміна — див. `CommentCard`). Джерело
 * даних — `useLocalComments` (демо-коментарі + власні, додані у цій сесії
 * браузера; реальний бекенд — `modules/comments`, Фаза 3+).
 */
export function CommentsBlock({
  lessonSlug,
  loggedIn,
  isAdmin = false,
  className,
}: CommentsBlockProps) {
  const { comments, addComment, deleteComment, react } = useLocalComments(
    lessonSlug,
    isAdmin,
  );
  const { openAuthModal } = useAuthModal();
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);

  const visibleComments = comments.slice(0, visibleCount);
  const remaining = comments.length - visibleComments.length;

  return (
    <Card padding="lg" className={className}>
      <h2 className="font-serif text-xl text-ink">Коментарі ({comments.length})</h2>

      <div className="mt-4 border-b border-rose-line/30 pb-5">
        {loggedIn ? (
          <CommentForm onSubmit={addComment} />
        ) : (
          <GuestCommentBanner onLoginClick={() => openAuthModal("login")} />
        )}
      </div>

      {comments.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">
          Поки що немає коментарів — будь першою, хто поділиться враженням від уроку.
        </p>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-5">
            {visibleComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                loggedIn={loggedIn}
                onReact={react}
                onRequireLogin={() => openAuthModal("login")}
                onDelete={() => deleteComment(comment.id)}
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
    </Card>
  );
}
