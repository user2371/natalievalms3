"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { CloseIcon, ChevronUpIcon, ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { AdminQuestionType } from "@/lib/data/admin";

export interface QuestionAnswerValue {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionFormValues {
  type: AdminQuestionType;
  text: string;
  /** URL картинки над текстом питання — лише коли `type === "image"` (задача 6.20). */
  imageUrl: string;
  answers: QuestionAnswerValue[];
}

export interface QuestionFormProps {
  initial?: Partial<QuestionFormValues>;
  onCancel: () => void;
  onSubmit: (values: QuestionFormValues) => void;
  submitLabel?: string;
  /** Помилка від сервера (задача 8.4.2) — показується під списком відповідей. */
  submitError?: string | null;
  /** `true` під час виконання server action (задача 8.7.3, loading-стан). */
  submitting?: boolean;
}

const TYPE_OPTIONS = [
  { value: "text", label: "Текст" },
  { value: "image", label: "Картинка" },
];

let answerIdCounter = 0;
function newAnswerId() {
  answerIdCounter += 1;
  return `new-answer-${answerIdCounter}`;
}

const EMPTY: QuestionFormValues = {
  type: "text",
  text: "",
  imageUrl: "",
  answers: [
    { id: newAnswerId(), text: "", isCorrect: true },
    { id: newAnswerId(), text: "", isCorrect: false },
    { id: newAnswerId(), text: "", isCorrect: false },
  ],
};

const MIN_ANSWERS = 2;

/**
 * Форма питання квізу (задача 0.13.9), за мокапом `adminPanel.png`: тип
 * питання (`Select`), текст питання, список відповідей. Кожна відповідь —
 * текстове поле + чекбокс "Правильна" (задача 0.13.10, реальний
 * функціональний перемикач) + декоративний радіо-індикатор зліва, що лише
 * віддзеркалює стан чекбокса (у мокапі показує, як питання виглядатиме
 * для учениці — одиночний вибір; сам файл не додає нового типу
 * "множинного вибору", лише прев'ю). Кнопки "+ Додати відповідь" і
 * видалення (✕, з мінімумом {MIN_ANSWERS} відповіді) — задача 0.13.10.
 *
 * 27.07.2026, Фаза 6 (задача 6.20): додано поле URL картинки — з'являється,
 * лише коли `type === "image"`. Файлове завантаження НЕ реалізовано —
 * у проєкті немає інфраструктури файлового сховища (S3/Cloudinary тощо),
 * той самий підхід, що вже усюди для зображень (`coverImage` курсу,
 * `avatarUrl` користувача, `masterAvatarUrl` — усі просто рядок URL, який
 * вводить адмін); "файл або URL" із формулювання задачі — URL.
 *
 * ⚠️ Ця сторінка/форма НЕ підключена до реального `modules/quizzes` —
 * `onSubmit` і сама сторінка `app/admin/courses/[courseId]/lessons/
 * [lessonId]/quiz/new/page.tsx` і далі працюють на статичних
 * `ADMIN_COURSES`/`ADMIN_LESSONS` (задокументована прогалина, та сама, що
 * вже є для `CourseForm`/`LessonForm` — реальне підключення адмінки до
 * `modules/courses`/`modules/lessons`/`modules/quizzes` це Фаза 8, окрема
 * задача, свідомо поза межами 6.20).
 *
 * 27.07.2026 (задачі 6.22/6.24):
 * - Валідація перед сабмітом (6.22) — та сама вимога, що вже в
 *   `modules/quizzes/schema.ts` (`CreateQuestionSchema.refine`): хоча б
 *   одна відповідь має бути позначена правильною. Помилка показується під
 *   списком відповідей, `onSubmit` пропуску не викликається.
 * - Стрілки вгору/вниз для зміни порядку відповідей (6.24) — той самий
 *   патерн (`move`, без справжнього drag-and-drop), що вже застосований
 *   для списку уроків в адмінці
 *   (`app/admin/courses/[courseId]/lessons/page.tsx`) і списку питань
 *   квізу (`app/admin/courses/[courseId]/lessons/[lessonId]/quiz/page.tsx`,
 *   задача 6.23).
 */
export function QuestionForm({
  initial,
  onCancel,
  onSubmit,
  submitLabel = "Зберегти",
  submitError = null,
  submitting = false,
}: QuestionFormProps) {
  const [values, setValues] = useState<QuestionFormValues>({
    ...EMPTY,
    ...initial,
    answers: initial?.answers ?? EMPTY.answers,
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof QuestionFormValues>(
    key: K,
    value: QuestionFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateAnswer(id: string, patch: Partial<QuestionAnswerValue>) {
    setValues((prev) => ({
      ...prev,
      answers: prev.answers.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }

  function addAnswer() {
    setValues((prev) => ({
      ...prev,
      answers: [...prev.answers, { id: newAnswerId(), text: "", isCorrect: false }],
    }));
  }

  function removeAnswer(id: string) {
    setValues((prev) =>
      prev.answers.length <= MIN_ANSWERS
        ? prev
        : { ...prev, answers: prev.answers.filter((a) => a.id !== id) },
    );
  }

  /** Задача 6.24: той самий "стрілки вгору/вниз" підхід, що для уроків/питань. */
  function moveAnswer(index: number, direction: -1 | 1) {
    setValues((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.answers.length) return prev;
      const next = [...prev.answers];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return { ...prev, answers: next };
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!values.answers.some((answer) => answer.isCorrect)) {
          setError("Хоча б одна відповідь має бути позначена правильною");
          return;
        }
        setError(null);
        onSubmit(values);
      }}
      className="flex flex-col gap-5"
    >
      <Select
        label="Тип питання"
        options={TYPE_OPTIONS}
        value={values.type}
        onChange={(e) => update("type", e.target.value as AdminQuestionType)}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-ink">Текст питання</label>
        <Textarea
          placeholder="Введіть питання"
          rows={2}
          value={values.text}
          onChange={(e) => update("text", e.target.value)}
        />
      </div>

      {values.type === "image" && (
        <Input
          label="URL картинки"
          type="url"
          placeholder="https://..."
          value={values.imageUrl}
          onChange={(e) => update("imageUrl", e.target.value)}
        />
      )}

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-ink">Відповіді</label>

        {values.answers.map((answer, index) => (
          <div key={answer.id} className="flex items-center gap-3">
            <span
              aria-hidden
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                answer.isCorrect ? "border-accent" : "border-rose-line/70",
              )}
            >
              {answer.isCorrect && <span className="h-2 w-2 rounded-full bg-accent" />}
            </span>

            <div className="flex-1">
              <Input
                placeholder={`Відповідь ${index + 1}`}
                value={answer.text}
                onChange={(e) => updateAnswer(answer.id, { text: e.target.value })}
              />
            </div>

            <Checkbox
              label="Правильна"
              checked={answer.isCorrect}
              onChange={(e) => updateAnswer(answer.id, { isCorrect: e.target.checked })}
            />

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveAnswer(index, -1)}
                disabled={index === 0}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft disabled:opacity-30"
                aria-label={`Перемістити відповідь ${index + 1} вище`}
              >
                <ChevronUpIcon size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveAnswer(index, 1)}
                disabled={index === values.answers.length - 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-cream-soft disabled:opacity-30"
                aria-label={`Перемістити відповідь ${index + 1} нижче`}
              >
                <ChevronDownIcon size={14} />
              </button>
            </div>

            {values.answers.length > MIN_ANSWERS && (
              <button
                type="button"
                onClick={() => removeAnswer(answer.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                aria-label={`Видалити відповідь ${index + 1}`}
              >
                <CloseIcon size={14} />
              </button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addAnswer}
          className="self-start"
        >
          + Додати відповідь
        </Button>

        {error && <p className="text-sm text-danger">{error}</p>}
        {submitError && <p className="text-sm text-danger">{submitError}</p>}
      </div>

      <div className="flex justify-end gap-3 border-t border-rose-line/30 pt-5">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Скасувати
        </Button>
        <Button type="submit" disabled={submitting} loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
