import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { TrashIcon, ShieldIcon, ReplyIcon } from "@/components/ui/icons";
import { CommentLikeButtons } from "@/components/lesson/CommentLikeButtons";
import type { CommentWithReaction } from "@/lib/progress/useLocalComments";
import type { Reaction } from "@/lib/progress/localComments";

export interface CommentCardProps {
  comment: CommentWithReaction;
  /** Гість бачить лічильники, але не може реагувати — клік веде до входу. */
  loggedIn: boolean;
  onReact: (commentId: string, reaction: Reaction) => void;
  onRequireLogin: () => void;
  onDelete: (commentId: string) => void;
  /**
   * F.25.8: клік "Відповісти" — відкриває/закриває inline-форму відповіді
   * під цією карткою, той самий патерн підйому стану до батьківського
   * блоку (`RealCommentsBlock`), що вже `onDelete`. Опційний — щоб картку
   * можна було й далі використовувати без функціоналу відповідей (напр.
   * майбутній legacy `CommentsBlock`, якщо туди колись знадобиться).
   */
  onReply?: (commentId: string) => void;
  /**
   * F.25.8: коли `true` — картка рендериться з візуальним відступом зліва
   * і трохи меншим аватаром, щоб належність до батьківського коментаря
   * було видно з першого погляду.
   */
  isReply?: boolean;
  /**
   * Задача 9.13: попередній запит лайк/дизлайк цього коментаря ще в польоті —
   * блокує обидві кнопки реакції (той самий disabled-стан, що вже був у
   * `CommentLikeButtons` для гостя), щоб виключити подвійний клік під час
   * мережевої затримки.
   */
  reactionPending?: boolean;
  className?: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Картка коментаря (задача 0.7.23): клікабельний аватар на публічний
 * профіль автора (`/users/[id]`, роздiл 0.9 — сторінка ще не збудована,
 * посилання вже готове наперед), імʼя, дата, текст, лайк/дизлайк (0.7.23a)
 * і умовна кнопка видалення (0.7.24) — для автора коментаря АБО для адміна
 * (`comment.canDelete`, задача 0.17: тепер враховує і
 * `DEMO_PROFILE.role === "ADMIN"`, не лише авторство). Коли видаляє не
 * автор, а адмін-модератор (`comment.deletableAsAdmin`) — інша піктограма
 * (`ShieldIcon` замість `TrashIcon`) і aria-label, щоб було видно різницю
 * між "видалити своє" і "модерація чужого".
 *
 * F.25.8: кнопка "Відповісти" (`ReplyIcon`) поруч із лайк/дизлайк/видалити
 * — гість тим самим принципом, що й лайк/дизлайк, веде до `onRequireLogin`,
 * а не одразу в `onReply`. `isReply` — візуальний маркер відповіді
 * (відступ зліва, менший аватар); сама inline-форма відповіді рендериться
 * ЗОВНІ цієї картки, у батьківському блоці (`RealCommentsBlock`).
 */
export function CommentCard({
  comment,
  loggedIn,
  onReact,
  onRequireLogin,
  onDelete,
  onReply,
  isReply = false,
  reactionPending,
  className,
}: CommentCardProps) {
  function handleToggle(reaction: Reaction) {
    if (!loggedIn) {
      onRequireLogin();
      return;
    }
    onReact(comment.id, reaction);
  }

  function handleReplyClick() {
    if (!loggedIn) {
      onRequireLogin();
      return;
    }
    onReply?.(comment.id);
  }

  return (
    <div
      className={`flex gap-3 ${isReply ? "ml-10 border-l-2 border-rose-line/30 pl-4" : ""} ${className ?? ""}`}
    >
      <Link href={`/users/${comment.authorId}`} className="shrink-0">
        <Avatar
          src={comment.authorAvatarUrl}
          name={comment.authorName}
          size={isReply ? 30 : 38}
        />
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <Link
            href={`/users/${comment.authorId}`}
            className="text-sm font-medium text-ink hover:text-accent-dark"
          >
            {comment.authorName}
          </Link>
          <span className="text-xs text-muted">
            {DATE_FORMATTER.format(new Date(comment.createdAt))}
          </span>
        </div>

        <p className="mt-1 text-sm leading-relaxed text-ink/90">{comment.text}</p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CommentLikeButtons
              likes={comment.likes}
              dislikes={comment.dislikes}
              myReaction={comment.myReaction}
              disabled={reactionPending}
              onToggle={handleToggle}
            />

            {onReply && (
              <button
                type="button"
                onClick={handleReplyClick}
                aria-label="Відповісти на коментар"
                className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-accent-dark"
              >
                <ReplyIcon size={15} />
                Відповісти
              </button>
            )}
          </div>

          {comment.canDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment.id)}
              aria-label={
                comment.deletableAsAdmin
                  ? "Видалити коментар (дії адміністратора)"
                  : "Видалити коментар"
              }
              title={comment.deletableAsAdmin ? "Видалити як адмін" : undefined}
              className="text-muted transition-colors hover:text-danger"
            >
              {comment.deletableAsAdmin ? (
                <ShieldIcon size={15} />
              ) : (
                <TrashIcon size={15} />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
