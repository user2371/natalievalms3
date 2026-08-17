"use client";

import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { QuizOption } from "@/lib/data/lessons";

export interface QuizOptionsProps {
  options: QuizOption[];
  /** Якщо `true` — чекбокси (декілька правильних), інакше — радіо (один). */
  multiple: boolean;
  selectedIds: string[];
  onToggle: (optionId: string) => void;
  /** Чи вже показано результат перевірки (правильно/неправильно). */
  checked: boolean;
  className?: string;
}

/**
 * Варіанти відповідей квізу (задача 0.7.16): радіо-стилізовані пункти для
 * одиночного вибору або чекбокс-стилізовані — для множинного. До перевірки
 * підсвічується лише обраний варіант (задача 0.7.18). Після перевірки —
 * правильні варіанти підсвічуються зеленим, хибно обрані — червоним.
 */
export function QuizOptions({
  options,
  multiple,
  selectedIds,
  onToggle,
  checked,
  className,
}: QuizOptionsProps) {
  return (
    <div
      className={cn("flex flex-col gap-2.5", className)}
      role={multiple ? "group" : "radiogroup"}
    >
      {options.map((option) => {
        const selected = selectedIds.includes(option.id);
        const showCorrect = checked && option.correct;
        const showIncorrect = checked && selected && !option.correct;

        return (
          <button
            key={option.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            disabled={checked}
            onClick={() => onToggle(option.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
              "disabled:cursor-default",
              !checked && selected && "border-accent bg-accent-soft/30 text-ink",
              !checked &&
                !selected &&
                "border-rose-line/50 bg-white text-ink/90 hover:border-accent/60",
              showCorrect && "border-success bg-success/10 text-ink",
              showIncorrect && "border-danger bg-danger/10 text-ink",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center border-2 text-white",
                multiple ? "rounded-md" : "rounded-full",
                !checked && selected && "border-accent bg-accent",
                !checked && !selected && "border-rose-line bg-transparent",
                showCorrect && "border-success bg-success",
                showIncorrect && "border-danger bg-danger",
              )}
            >
              {(selected || showCorrect) &&
                (showIncorrect ? <CloseIcon size={12} /> : <CheckIcon size={12} />)}
            </span>

            <span className="flex-1">{option.text}</span>
          </button>
        );
      })}
    </div>
  );
}
