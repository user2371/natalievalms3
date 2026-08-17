import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** Текст для screen-reader'ів (за замовчуванням — "Завантаження") */
  label?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

/**
 * Кружечок-індикатор завантаження. Той самий візуальний патерн, що вже
 * використовується у `Button` (`loading` пропс) — border-spin з
 * прозорим верхнім краєм, — винесений в окремий переспільний компонент,
 * щоб не дублювати розмітку в кожному `loading.tsx` та інших місцях,
 * де потрібно показати "на сайті йде завантаження".
 */
export function Spinner({
  size = "md",
  className,
  label = "Завантаження",
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-block animate-spin rounded-full border-accent-soft border-t-accent",
        sizeStyles[size],
        className,
      )}
    >
      <span className="sr-only">{label}...</span>
    </span>
  );
}
