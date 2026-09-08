import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

/**
 * MSG+.7.8 (07.09.2026) — обгорнуто в `forwardRef`: новий емодзі-пікер
 * у `ChatPanel.tsx` вставляє символ у поточну позицію курсора
 * (`selectionStart`/`selectionEnd` через прямий доступ до DOM-вузла
 * `<textarea>`, не лише через контрольований `value`), для чого
 * потрібен реальний `ref` на сам елемент — раніше компонент його не
 * прокидував. Зворотно сумісно: усі наявні виклики (`CourseForm`,
 * `QuestionForm`, `ArticleForm`, `CommentForm`, `ReportMessageModal`,
 * `/settings`) не передають `ref` і продовжують працювати без змін.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, label, className, id, rows = 3, ...rest },
  ref,
) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        className={cn(
          "w-full resize-none rounded-xl border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted",
          "focus:outline-none",
          error ? "border-danger" : "border-rose-line/60 focus:border-accent",
          className,
        )}
        {...rest}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
});
