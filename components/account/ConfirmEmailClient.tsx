"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { MailIcon } from "@/components/ui/icons";
import { confirmEmailChangeAction } from "@/modules/account/actions";

export interface ConfirmEmailClientProps {
  token: string | null;
}

type ConfirmState = "loading" | "success" | "error";

/**
 * `ConfirmEmailClient` — Фаза 3+, задачі 3+.2.3 (друга половина флоу,
 * сторінка призначення посилання з листа) + 3+.2.6 (`useSession().
 * update({ email })`).
 *
 * Клієнтський компонент (а не одразу серверна логіка на сторінці) —
 * потрібен `useSession().update(...)` (той самий `next-auth/react` хук,
 * що вже в `app/settings/page.tsx` для фото/bio) для миттєвого
 * оновлення `Header`/`AccountLayout` новим email без релогіну, якщо
 * посилання відкрито в тій самій сесії/браузері, де користувач
 * залогінений. Якщо сесії тут немає (лист відкрито деінде) —
 * `updateSession` просто ні на що не впливає, сам email у БД однаково
 * вже змінено `confirmEmailChangeAction` (не залежить від наявності
 * сесії саме тут, див. коментар у `modules/account/actions.ts`).
 *
 * Запускається РІВНО ОДИН РАЗ при заході на сторінку (залежність лише
 * від `token`) — той самий принцип "рівно раз на появу", що вже в
 * `useEffect` на `/settings` для `getPublicProfileAction`.
 */
export function ConfirmEmailClient({ token }: ConfirmEmailClientProps) {
  const { update: updateSession } = useSession();
  const [state, setState] = useState<ConfirmState>(token ? "loading" : "error");
  const [message, setMessage] = useState<string | null>(
    token ? null : "Посилання недійсне: не передано токен підтвердження.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    confirmEmailChangeAction(token).then(async (result) => {
      if (cancelled) return;
      if (result.success) {
        await updateSession({ email: result.email });
        setState("success");
      } else {
        setState("error");
        setMessage(result.error);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="flex flex-1 flex-col">
      <Header user={null} />

      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
            <MailIcon size={24} />
          </span>

          {state === "loading" && (
            <div>
              <h1 className="font-serif text-2xl text-ink">Підтверджуємо…</h1>
              <p className="mt-2 text-sm text-muted">Перевіряємо посилання, зачекайте.</p>
            </div>
          )}

          {state === "success" && (
            <div>
              <h1 className="font-serif text-2xl text-ink">Email змінено</h1>
              <p className="mt-2 text-sm text-muted">
                Новий email підтверджено й збережено. Тепер він використовується для
                входу.
              </p>
            </div>
          )}

          {state === "error" && (
            <div>
              <h1 className="font-serif text-2xl text-ink">Не вдалося підтвердити</h1>
              <p className="mt-2 text-sm text-muted">{message}</p>
            </div>
          )}

          {state !== "loading" && (
            <Link href="/settings" className="mt-2">
              <Button>Повернутися до налаштувань</Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
