"use client";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { UserIcon } from "@/components/ui/icons";
import { useAuthModal } from "@/components/auth/AuthModalContext";

export interface GuestGateProps {
  /** Що саме недоступне — вставляється в текст "щоб отримати доступ до {description}". */
  description: string;
}

/**
 * Заглушка для приватних сторінок кабінету (`/profile`, `/certificates`,
 * `/my-learning`, `/settings`, `/homework`, і "власна" гілка `/users/[id]`
 * та `/users/[id]/certificates`), коли відвідувач не залогінений (задача
 * 0.19, за прямим проханням користувача): замість `AccountLayout` з
 * контентом — `Header` (без сайдбару кабінету, як на чужому `/users/[id]`)
 * і заклик зареєструватись/увійти.
 *
 * У Фазі 0 немає реальних сесій, тому кожна сторінка й далі сама вирішує,
 * показувати `<GuestGate />` чи контент, за локальним демо-тоглом
 * `loggedIn` (за замовчуванням `true`, стає `false` після кліку "Вийти" в
 * `AccountSidebar`). У Фазі 2+ це замінюється на реальну перевірку сесії
 * (Auth.js) — ідеально на рівні `middleware`, а не лише в UI компонента,
 * той самий принцип "не тільки в UI", що вже задокументований для
 * `/admin/*` і адмін-модерації коментарів у `CLAUDE.md`.
 */
export function GuestGate({ description }: GuestGateProps) {
  const { openAuthModal } = useAuthModal();

  return (
    <div className="flex flex-1 flex-col">
      <Header user={null} />

      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
            <UserIcon size={24} />
          </span>
          <div>
            <h1 className="font-serif text-2xl text-ink">Потрібна реєстрація</h1>
            <p className="mt-2 text-sm text-muted">
              Щоб отримати доступ до {description}, увійдіть або створіть безкоштовний
              акаунт.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button onClick={() => openAuthModal("register")}>Зареєструватися</Button>
            <Button variant="outline" onClick={() => openAuthModal("login")}>
              Увійти
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
