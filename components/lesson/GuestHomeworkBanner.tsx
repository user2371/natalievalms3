import { Button } from "@/components/ui/Button";
import { YoutubeIcon } from "@/components/ui/icons";

export interface GuestHomeworkBannerProps {
  onLoginClick: () => void;
  className?: string;
}

/**
 * Стан для гостя в `HomeworkBlock` (задача 0.19) — замість форми здачі ДЗ
 * банер із закликом зареєструватись. Той самий патерн, що
 * `GuestCommentBanner` (0.7.22): у `localStorage` для незареєстрованого
 * відвідувача зберігається лише прогрес проходження уроків/квізів
 * (`lib/progress/localProgress.ts`), а не здані домашні завдання — здача
 * ДЗ, як і коментування, вимагає реєстрації.
 */
export function GuestHomeworkBanner({
  onLoginClick,
  className,
}: GuestHomeworkBannerProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl bg-cream-soft/60 px-5 py-6 text-center sm:flex-row sm:justify-between sm:text-left ${className ?? ""}`}
    >
      <span className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-accent-dark">
          <YoutubeIcon size={16} />
        </span>
        <span className="text-sm text-ink">
          Зареєструйтесь, щоб здати відео домашнього завдання
        </span>
      </span>
      <Button type="button" variant="outline" size="sm" onClick={onLoginClick}>
        Зареєструватися
      </Button>
    </div>
  );
}
