"use client";

import { ThumbsDownIcon, ThumbsUpIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { Reaction } from "@/lib/progress/localComments";

export interface CommentLikeButtonsProps {
  likes: number;
  dislikes: number;
  myReaction: Reaction | null;
  /** Гостю недоступні реакції — клік відкриває AuthModal замість toggle. */
  disabled?: boolean;
  onToggle: (reaction: Reaction) => void;
  className?: string;
}

/**
 * Лайк/дизлайк під коментарем (задача 0.7.23a): дві кнопки-іконки з
 * лічильниками, активний стан підсвічений для власного вибору користувача,
 * взаємовиключні — лайк знімає дизлайк і навпаки (логіка toggle — у
 * `lib/progress/localComments.ts`).
 */
export function CommentLikeButtons({
  likes,
  dislikes,
  myReaction,
  disabled,
  onToggle,
  className,
}: CommentLikeButtonsProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => onToggle("like")}
        disabled={disabled}
        aria-pressed={myReaction === "like"}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors",
          myReaction === "like" ? "text-accent-dark" : "text-muted hover:text-ink",
          disabled && "cursor-not-allowed opacity-60 hover:text-muted",
        )}
      >
        <ThumbsUpIcon size={15} filled={myReaction === "like"} />
        {likes}
      </button>

      <button
        type="button"
        onClick={() => onToggle("dislike")}
        disabled={disabled}
        aria-pressed={myReaction === "dislike"}
        className={cn(
          "flex items-center gap-1.5 text-sm transition-colors",
          myReaction === "dislike" ? "text-danger" : "text-muted hover:text-ink",
          disabled && "cursor-not-allowed opacity-60 hover:text-muted",
        )}
      >
        <ThumbsDownIcon size={15} filled={myReaction === "dislike"} />
        {dislikes}
      </button>
    </div>
  );
}
