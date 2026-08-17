"use client";

import { SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

/** Нативний `<select>` у стилі `Input` — для форм адмінки (провайдер відео, тип питання). */
export function Select({ label, options, className, id, ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative flex items-center rounded-xl border border-rose-line/60 bg-white px-4 py-3 focus-within:border-accent">
        <select
          id={id}
          className={cn(
            "w-full appearance-none bg-transparent pr-6 text-sm text-ink focus:outline-none",
            className,
          )}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 text-muted">
          <ChevronDownIcon size={16} />
        </span>
      </div>
    </div>
  );
}
