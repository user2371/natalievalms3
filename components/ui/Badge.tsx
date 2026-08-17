import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "soft" | "outline" | "solid";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  soft: "bg-accent-soft text-accent-dark",
  outline: "border border-rose-line text-accent-dark bg-transparent",
  solid: "bg-accent text-white",
};

export function Badge({
  variant = "soft",
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase",
        variantStyles[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
