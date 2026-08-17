import type { ReactNode } from "react";
import type { Metadata } from "next";

/**
 * `/lessons` — легасі демо-каталог (статичний `lib/data/lessons.ts`,
 * Фаза 0), і далі використовується внутрішніми посиланнями (`/my-learning`,
 * `/homework`, `LessonContentHeader` — не чіпали, задокументована
 * архітектурна розбіжність з реальним `/courses`). robots noindex — щоб
 * пошуковики індексували РЕАЛЬНИЙ каталог (`/courses`), а не легасі-дублікат
 * (задача 9.16).
 */
export const metadata: Metadata = {
  title: "Уроки",
  robots: { index: false, follow: true },
};

export default function LessonsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
