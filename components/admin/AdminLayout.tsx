"use client";

import { ReactNode, useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";

/**
 * Спільний каркас усіх сторінок адмінки (задача 0.13.1), за мокапом
 * `adminPanel.png`: самостійний layout БЕЗ публічного маркетингового
 * `Header` — лише `AdminSidebar` зліва (десктоп) + контент справа, як у
 * мокапі. "Вийти" — поки локальний демо-стан (`loggedOut`), що просто
 * показує заглушку замість реального виходу із сесії (Auth — Фаза 2;
 * middleware-захист `/admin/*` за роллю ADMIN — задача 2.17).
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  const [loggedOut, setLoggedOut] = useState(false);

  if (loggedOut) {
    return (
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif text-2xl text-ink">Ви вийшли з адмін-панелі</p>
        <p className="text-sm text-muted">
          Це демо-стан без реальної автентифікації (Фаза 2). Оновіть сторінку, щоб
          повернутись.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <AdminSidebar onLogout={() => setLoggedOut(true)} />

      <div className="min-w-0 flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-6 py-8 sm:py-10">{children}</div>
      </div>

      <AdminMobileNav onLogout={() => setLoggedOut(true)} />
    </div>
  );
}
