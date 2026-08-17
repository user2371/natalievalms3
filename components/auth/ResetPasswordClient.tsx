"use client";

import { FormEvent, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { LockIcon, ArrowRightIcon } from "@/components/ui/icons";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { resetPasswordAction } from "@/modules/auth";

export interface ResetPasswordClientProps {
  token: string | null;
}

interface FieldErrors {
  newPassword?: string;
  confirmPassword?: string;
}

/**
 * `ResetPasswordClient` — Фаза FIXES, задача F.20 ("Забув пароль").
 * Сторінка призначення посилання з листа (`/reset-password?token=...`,
 * `lib/email/passwordResetMail.ts`). Той самий принцип, що
 * `ConfirmEmailClient` (задача 3+.2.3) — навмисно ПОЗА
 * `AccountLayout`/`GuestGate`: посилання відкривають БЕЗ активної сесії
 * (весь сенс флоу — користувач не може увійти, щоб змінити пароль зі
 * `/settings`).
 *
 * На відміну від `ConfirmEmailClient` (одноразова дія одразу при заході
 * на сторінку), тут показуємо ФОРМУ нового пароля — сам токен лише
 * перевіряється на сервері в момент сабміту (`resetPasswordAction`), не
 * заздалегідь: немає сенсу робити окремий "перевірочний" виклик до
 * форми, недійсний/протермінований токен так само покаже помилку під
 * час сабміту.
 *
 * Після успіху — не логінить автоматично (токен скидання пароля не є
 * доказом сесії, лише доказом доступу до пошти) і не веде на `/settings`
 * (користувач іще не залогінений) — замість цього відкриває звичну
 * `AuthModal` на екрані "login" (`useAuthModal`, глобальний
 * `AuthModalProvider` з `app/layout.tsx`), щоб одразу увійти з новим
 * паролем.
 */
export function ResetPasswordClient({ token }: ResetPasswordClientProps) {
  const { openAuthModal } = useAuthModal();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(
    token ? null : "Посилання недійсне: не передано токен скидання пароля.",
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (newPassword.length < 6) next.newPassword = "Пароль має містити мінімум 6 символів";
    if (confirmPassword !== newPassword) next.confirmPassword = "Паролі повинні збігатися";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!token) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await resetPasswordAction({ token, newPassword, confirmPassword });
      if (result.success) {
        setSuccess(true);
      } else {
        setFormError(result.error || "Не вдалося скинути пароль");
      }
    } catch {
      setFormError("Не вдалося скинути пароль");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header user={null} />

      <main className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm">
          {success ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
                <LockIcon size={24} />
              </span>
              <div>
                <h1 className="font-serif text-2xl text-ink">Пароль змінено</h1>
                <p className="mt-2 text-sm text-muted">
                  Новий пароль збережено. Тепер можна увійти з ним.
                </p>
              </div>
              <Button className="mt-2" onClick={() => openAuthModal("login")}>
                Увійти
              </Button>
            </div>
          ) : !token ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
                <LockIcon size={24} />
              </span>
              <div>
                <h1 className="font-serif text-2xl text-ink">Не вдалося скинути пароль</h1>
                <p className="mt-2 text-sm text-muted">{formError}</p>
              </div>
              <Button className="mt-2" onClick={() => openAuthModal("forgot-password")}>
                Запросити нове посилання
              </Button>
            </div>
          ) : (
            <div>
              <h2 className="font-serif text-[26px] leading-tight">
                <span className="text-accent-dark">Новий</span> пароль
              </h2>
              <p className="mt-2 text-sm text-muted">
                Введіть новий пароль для свого акаунта
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
                <Input
                  id="reset-new-password"
                  label="Новий пароль"
                  type="password"
                  icon={<LockIcon size={16} />}
                  placeholder="Введи новий пароль"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={errors.newPassword}
                  autoComplete="new-password"
                />
                <Input
                  id="reset-confirm-password"
                  label="Підтвердження паролю"
                  type="password"
                  icon={<LockIcon size={16} />}
                  placeholder="Повтори новий пароль"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  autoComplete="new-password"
                />

                {formError && <p className="text-sm text-danger">{formError}</p>}

                <Button
                  type="submit"
                  fullWidth
                  icon={<ArrowRightIcon size={18} />}
                  loading={loading}
                >
                  Зберегти новий пароль
                </Button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
