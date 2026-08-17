import { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
}

export function Textarea({
  error,
  label,
  className,
  id,
  rows = 3,
  ...rest
}: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
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
}
