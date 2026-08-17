"use client";

import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: ReactNode;
}

export function Checkbox({ label, className, id, ...rest }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink"
    >
      <input
        id={id}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border-rose-line text-accent accent-accent focus:ring-accent/40",
          className,
        )}
        {...rest}
      />
      {label && <span>{label}</span>}
    </label>
  );
}
