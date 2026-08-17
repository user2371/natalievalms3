import { Button } from "@/components/ui/Button";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface QuizNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
  className?: string;
}

/**
 * Кнопки навігації квізу (задача 0.7.17): "← Попереднє питання" /
 * "Наступне питання →". На першому питанні кнопка "Попереднє" неактивна.
 */
export function QuizNavigation({
  onPrev,
  onNext,
  isFirst,
  isLast,
  className,
}: QuizNavigationProps) {
  return (
    <div className={cn("flex items-center justify-between gap-3", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        icon={<ArrowLeftIcon size={16} />}
        iconPosition="left"
        onClick={onPrev}
        disabled={isFirst}
      >
        Попереднє питання
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        icon={<ArrowRightIcon size={16} />}
        iconPosition="right"
        onClick={onNext}
        disabled={isLast}
      >
        Наступне питання
      </Button>
    </div>
  );
}
