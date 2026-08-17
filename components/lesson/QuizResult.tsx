import { Button } from "@/components/ui/Button";
import { DiplomaIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface QuizResultProps {
  correctCount: number;
  total: number;
  onRetake: () => void;
  className?: string;
}

/**
 * Фінальний екран квізу (задача 0.7.19): результат "X з Y правильних" +
 * кнопка "Пройти ще раз" для скидання відповідей і повторного проходження.
 */
export function QuizResult({
  correctCount,
  total,
  onRetake,
  className,
}: QuizResultProps) {
  const allCorrect = correctCount === total;

  return (
    <div className={cn("flex flex-col items-center gap-3 py-4 text-center", className)}>
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full",
          allCorrect
            ? "bg-success/15 text-success"
            : "bg-accent-soft/60 text-accent-dark",
        )}
      >
        <DiplomaIcon size={26} />
      </span>

      <h3 className="font-serif text-xl text-ink">Квіз завершено</h3>

      <p className="text-sm text-ink/85">
        Результат:{" "}
        <span
          className={cn(
            "font-semibold",
            allCorrect ? "text-success" : "text-accent-dark",
          )}
        >
          {correctCount} з {total}
        </span>{" "}
        правильних відповідей
      </p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetake}
        className="mt-1"
      >
        Пройти ще раз
      </Button>
    </div>
  );
}
