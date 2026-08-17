import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  trackClassName?: string;
  barClassName?: string;
  size?: "sm" | "md";
}

export function ProgressBar({
  value,
  className,
  trackClassName,
  barClassName,
  size = "md",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const height = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full rounded-full bg-accent-soft/60",
        height,
        trackClassName,
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full bg-accent transition-all duration-300",
          barClassName,
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
