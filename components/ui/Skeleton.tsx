import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/**
 * Базовий "скелетон"-блок (ФАЗА SKELETON, задача SKEL.1) — прямокутник з
 * `animate-pulse` і тим самим кольором заглушки, що вже використовується
 * під фото/обкладинки, поки немає реального `src`
 * (`bg-accent-soft` — той самий клас, що на `RealCourseCard`/`ProfileHero`
 * для порожньої картинки). Розмір/форма — повністю через `className`
 * (`h-4 w-32`, `rounded-full` для аватарів, `aspect-[16/10]` для обкладинок
 * тощо), сам компонент не нав'язує форму.
 *
 * `role="presentation"` — це суто візуальний плейсхолдер, не контент;
 * реальний livecycle оголошення "триває завантаження" бере на себе
 * найближчий `aria-busy`/`Spinner`-текст навколо (той самий підхід, що вже
 * в `Spinner.tsx` з `role="status"` + `sr-only`-текстом), щоб
 * screen-reader не намагався озвучити купу порожніх `<div>`.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      role="presentation"
      className={cn("animate-pulse rounded-md bg-accent-soft/70", className)}
    />
  );
}
