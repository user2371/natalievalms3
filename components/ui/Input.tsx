"use client";

import { InputHTMLAttributes, ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
  label?: string;
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A11.6 11.6 0 0 1 12 5c7 0 11 7 11 7a17.4 17.4 0 0 1-3.4 4.2M6.6 6.6C3.5 8.5 1 12 1 12s4 7 11 7a10.6 10.6 0 0 0 4.4-.9" />
      <path d="M14.1 14.1a3 3 0 0 1-4.2-4.2" />
    </svg>
  );
}

export function Input({
  icon,
  error,
  label,
  type = "text",
  className,
  id,
  ...rest
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white px-4 py-3",
          error ? "border-danger" : "border-rose-line/60 focus-within:border-accent",
        )}
      >
        {icon && <span className="text-muted shrink-0">{icon}</span>}
        <input
          id={id}
          type={resolvedType}
          className={cn(
            "w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none",
            className,
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-muted shrink-0 hover:text-ink"
            aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
