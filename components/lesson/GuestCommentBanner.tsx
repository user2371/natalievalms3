import { Button } from "@/components/ui/Button";
import { UserIcon } from "@/components/ui/icons";

export interface GuestCommentBannerProps {
  onLoginClick: () => void;
  className?: string;
}

/**
 * Стан для гостя (задача 0.7.22): замість форми коментаря — банер із
 * закликом увійти. Кнопка відкриває `AuthModal` (екран `login`) через
 * `useAuthModal()` у батьківському компоненті.
 */
export function GuestCommentBanner({ onLoginClick, className }: GuestCommentBannerProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl bg-cream-soft/60 px-5 py-6 text-center sm:flex-row sm:justify-between sm:text-left ${className ?? ""}`}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent-dark">
          <UserIcon size={16} />
        </span>
        <span className="text-sm text-ink">Увійдіть, щоб залишити коментар</span>
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onLoginClick}>
        Увійти
      </Button>
    </div>
  );
}
