"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { progressSyncToastDismissed } from "@/lib/store/slices/progressSyncToastSlice";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const AUTO_DISMISS_MS = 4000;

/**
 * `components/progress/ProgressSyncToast.tsx` (задача 7.11) — сам тост
 * "Прогрес синхронізовано" (і повідомлення про помилку sync, задача
 * 7.12). Рендериться ОДИН РАЗ у корені дерева (`app/layout.tsx`), той
 * самий підхід, що й `AuthModalAutoOpen` — стан читає з
 * `progressSyncToastSlice` (RTK), а не з пропсів.
 */
export function ProgressSyncToast() {
  const dispatch = useAppDispatch();
  const { message, variant } = useAppSelector((state) => state.progressSyncToast);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(
      () => dispatch(progressSyncToastDismissed()),
      AUTO_DISMISS_MS,
    );
    return () => clearTimeout(timer);
  }, [message, dispatch]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg animate-auth-fade-in"
      style={{
        borderColor:
          variant === "success" ? "var(--color-accent)" : "var(--color-danger)",
        backgroundColor: "var(--color-cream)",
      }}
    >
      {variant === "success" && (
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-dark",
          )}
        >
          <CheckIcon size={12} />
        </span>
      )}
      <span className={variant === "success" ? "text-ink" : "text-danger"}>
        {message}
      </span>
    </div>
  );
}
