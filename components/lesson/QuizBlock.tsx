"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SparkleIcon } from "@/components/ui/icons";
import { QuizQuestionView } from "@/components/lesson/QuizQuestionView";
import { QuizOptions } from "@/components/lesson/QuizOptions";
import { QuizNavigation } from "@/components/lesson/QuizNavigation";
import { QuizResult } from "@/components/lesson/QuizResult";
import { cn } from "@/lib/utils";
import { DEFAULT_QUIZ_QUESTIONS, type QuizQuestion } from "@/lib/data/lessons";

export interface QuizBlockProps {
  questions?: QuizQuestion[];
  /**
   * Викликається при завершенні квізу (кнопка "Завершити квіз").
   * 27.07.2026, задача 6.17: тепер передає результат (`correctCount`/`total`)
   * — потрібно споживачу, щоб вирішити, як/чи зберігати результат (сесія →
   * `Progress` в БД, гість → `localStorage`, задача 6.17). Розширення
   * зворотно сумісне: колбек, оголошений без параметрів (`() => {...}`,
   * як і раніше), і далі коректно приймається TypeScript — зайвий аргумент
   * просто ігнорується. Жоден наявний виклик (`/lessons/[slug]`) правок
   * не потребував.
   */
  onComplete?: (result: { correctCount: number; total: number }) => void;
  className?: string;
  /**
   * Якщо `true` — рендериться БЕЗ зовнішнього `<Card>` і без заголовка
   * "Квіз до уроку" (лічильник питань лишається). Використовується, коли
   * блок уже загорнутий у власний контейнер із заголовком — напр.
   * `LessonSpoiler` на сторінці уроку.
   */
  bare?: boolean;
}

/**
 * Блок "Квіз до уроку" (задачі 0.7.14–0.7.19): заголовок + лічильник
 * "Питання N з M", саме питання (з необов'язковою картинкою), варіанти
 * відповідей (радіо/чекбокс залежно від `question.multiple`), кнопка
 * перевірки з підсвіткою правильно/неправильно, навігація між питаннями
 * та фінальний екран результату після останнього питання.
 */
export function QuizBlock({
  questions = DEFAULT_QUIZ_QUESTIONS,
  onComplete,
  className,
  bare = false,
}: QuizBlockProps) {
  const [index, setIndex] = useState(0);
  // Обрані варіанти по кожному питанню (id питання -> id обраних варіантів).
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  // Питання, для яких вже показано результат перевірки.
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  // Чи показано фінальний екран результату (задача 0.7.19).
  const [finished, setFinished] = useState(false);

  const total = questions.length;
  const question = questions[index];
  const selectedIds = answers[question.id] ?? [];
  const checked = checkedIds.has(question.id);

  function isQuestionCorrect(q: QuizQuestion) {
    const correctIds = q.options.filter((o) => o.correct).map((o) => o.id);
    const selected = answers[q.id] ?? [];
    return (
      selected.length === correctIds.length &&
      selected.every((id) => correctIds.includes(id))
    );
  }

  const isCorrect = checked && isQuestionCorrect(question);
  const correctCount = questions.filter((q) => isQuestionCorrect(q)).length;

  function handleToggle(optionId: string) {
    if (checked) return;

    setAnswers((prev) => {
      const current = prev[question.id] ?? [];

      if (question.multiple) {
        const next = current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId];
        return { ...prev, [question.id]: next };
      }

      return { ...prev, [question.id]: [optionId] };
    });
  }

  function handleCheck() {
    setCheckedIds((prev) => new Set(prev).add(question.id));
  }

  function goPrev() {
    setIndex((prev) => Math.max(0, prev - 1));
  }

  function goNext() {
    setIndex((prev) => Math.min(total - 1, prev + 1));
  }

  function handleFinish() {
    setFinished(true);
    onComplete?.({ correctCount, total });
  }

  function handleRetake() {
    setIndex(0);
    setAnswers({});
    setCheckedIds(new Set());
    setFinished(false);
  }

  const content = (
    <>
      <div className={cn("flex items-center justify-between gap-3", bare && "mt-0")}>
        {bare ? (
          !finished && (
            <span className="text-sm font-medium text-muted">
              Питання {index + 1} з {total}
            </span>
          )
        ) : (
          <>
            <span className="flex items-center gap-3">
              <h2 className="font-serif text-xl text-ink">Квіз до уроку</h2>
              <Badge variant="soft" icon={<SparkleIcon size={13} />}>
                Перевір себе
              </Badge>
            </span>

            {!finished && (
              <span className="shrink-0 text-sm font-medium text-muted">
                Питання {index + 1} з {total}
              </span>
            )}
          </>
        )}
      </div>

      {finished ? (
        <QuizResult
          correctCount={correctCount}
          total={total}
          onRetake={handleRetake}
          className="mt-2"
        />
      ) : (
        <>
          <QuizQuestionView question={question} className="mt-5" />

          <QuizOptions
            options={question.options}
            multiple={Boolean(question.multiple)}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            checked={checked}
            className="mt-4"
          />

          <div className="mt-5 flex min-h-10 items-center justify-between gap-3 border-t border-rose-line/30 pt-5">
            {!checked ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleCheck}
                disabled={selectedIds.length === 0}
              >
                Перевірити відповідь
              </Button>
            ) : (
              <span
                className={cn(
                  "text-sm font-medium",
                  isCorrect ? "text-success" : "text-danger",
                )}
              >
                {isCorrect ? "Правильно!" : "Неправильно, спробуй наступного разу"}
              </span>
            )}

            {checked && index === total - 1 && (
              <Button type="button" variant="primary" size="sm" onClick={handleFinish}>
                Завершити квіз
              </Button>
            )}
          </div>

          <QuizNavigation
            onPrev={goPrev}
            onNext={goNext}
            isFirst={index === 0}
            isLast={index === total - 1}
            className="mt-4"
          />
        </>
      )}
    </>
  );

  if (bare) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card padding="lg" className={className}>
      {content}
    </Card>
  );
}
