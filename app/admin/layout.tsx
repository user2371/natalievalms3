import { ReactNode } from "react";
import type { Metadata } from "next";
import { AdminLayout } from "@/components/admin/AdminLayout";

/**
 * Задача 9.16 (перевірка SEO-метаданих): `robots: noindex/nofollow` для
 * всієї адмінки (`/admin/**`, `Metadata` тут застосовується до всього
 * дерева маршрутів під цим layout) — приватна панель керування контентом,
 * її не повинно бути в пошуковій видачі, навіть якщо на неї десь
 * випадково послались (захист доступу — окремо, через `middleware.ts`,
 * роль ADMIN; це суто SEO-гігієна, не безпека).
 */
export const metadata: Metadata = {
  title: "Адмін-панель",
  robots: { index: false, follow: false },
};

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
