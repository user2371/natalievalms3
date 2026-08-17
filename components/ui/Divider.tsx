import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DividerProps {
  children?: ReactNode;
  className?: string;
}

export function Divider({ children, className }: DividerProps) {
  if (!children) {
    return <hr className={cn("border-rose-line/50", className)} />;
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <span className="h-px flex-1 bg-rose-line/50" />
      <span className="text-sm text-muted">{children}</span>
      <span className="h-px flex-1 bg-rose-line/50" />
    </div>
  );
}
