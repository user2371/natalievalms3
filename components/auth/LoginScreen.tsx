"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { MailIcon, LockIcon, ArrowRightIcon } from "@/components/ui/icons";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { isValidEmail } from "@/lib/auth/validation";
import { useProgressSync } from "@/lib/progress/useProgressSync";
import { loginUserAction } from "@/modules/auth";

export interface LoginScreenProps {
  onSwitchToRegister: () => void;
  /** Фаза FIXES, задача F.20: перемикання на екран "Забув пароль". */
  onSwitchToForgotPassword: () => void;
  onSuccess: () => void;
}

interface FieldErrors {
  email?: string;
  password?: string;
}

export function LoginScreen({
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onSuccess,
}: LoginScreenProps) {
  const { update: updateSession } = useSession();
  const { syncProgress } = useProgressSync();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!isValidEmail(email)) next.email = "Введіть коректний email";
    if (password.length === 0) next.password = "Введіть пароль";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await loginUserAction({ email, password, rememberMe: remember });
      if (!res.success) {
        setFormError(res.error || "Не вдалося увійти. Перевірте email і пароль.");
      } else {
        // `signIn` в `loginUserAction` виконується на сервері й лише
        // виставляє cookie — клієнтський `useSession()` (звідси й Header)
        // сам по собі про це не дізнається без явного рефетчу (задача 2.14).
        await updateSession();
        // Задача 7.6: після успішного логіну — one-time мерж
        // localStorage-прогресу гостя в БД.
        await syncProgress();
        onSuccess();
      }
    } catch {
      setFormError("Не вдалося увійти. Перевірте email і пароль.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 id="auth-modal-title" className="font-serif text-[26px] leading-tight">
        <span className="text-accent-dark">Вхід</span> у акаунт
      </h2>
      <p className="mt-2 text-sm text-muted">
        Продовжуй навчання та відкривай нові знання разом з нами
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
        <Input
          id="login-email"
          label="Email"
          type="email"
          icon={<MailIcon size={16} />}
          placeholder="Введи свій email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          id="login-password"
          label="Пароль"
          type="password"
          icon={<LockIcon size={16} />}
          placeholder="Введи свій пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <Checkbox
            id="remember-me"
            label="Запам'ятати мене"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-accent-dark hover:underline"
          >
            Забули пароль?
          </button>
        </div>

        {formError && <p className="text-sm text-danger">{formError}</p>}

        <Button
          type="submit"
          fullWidth
          icon={<ArrowRightIcon size={18} />}
          loading={loading}
        >
          Увійти
        </Button>
      </form>

      <Divider className="my-6">або</Divider>

      <Button
        type="button"
        variant="outline"
        fullWidth
        icon={<GoogleIcon />}
        iconPosition="left"
      >
        Увійти через Google
      </Button>

      <p className="mt-6 text-center text-sm text-muted">
        Ще не маєш акаунту?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-medium text-accent-dark hover:underline"
        >
          Реєстрація
        </button>
      </p>
    </div>
  );
}
