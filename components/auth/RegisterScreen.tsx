"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { MailIcon, LockIcon, UserIcon, ArrowRightIcon } from "@/components/ui/icons";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { isValidEmail } from "@/lib/auth/validation";
import { useProgressSync } from "@/lib/progress/useProgressSync";
import { registerUserAction } from "@/modules/auth";

export interface RegisterScreenProps {
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  agree?: string;
}

export function RegisterScreen({ onSwitchToLogin, onSuccess }: RegisterScreenProps) {
  const { update: updateSession } = useSession();
  const { syncProgress } = useProgressSync();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (!firstName.trim()) next.firstName = "Введіть ім'я";
    if (!lastName.trim()) next.lastName = "Введіть прізвище";
    if (!isValidEmail(email)) next.email = "Введіть коректний email";
    if (password.length < 6) next.password = "Мінімум 6 символів";
    if (confirmPassword !== password) next.confirmPassword = "Паролі повинні збігатися";
    if (!agree) next.agree = "Потрібна згода з умовами використання";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await registerUserAction({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        agreeTerms: agree,
      });
      if (!res.success) {
        setFormError(res.error || "Не вдалося зареєструватися. Спробуйте ще раз.");
      } else {
        // Той самий фікс, що й у LoginScreen: після авто-логіну на сервері
        // потрібен явний рефетч клієнтської сесії, щоб Header оновився
        // одразу, без очікування window focus (задача 2.14).
        await updateSession();
        // Задача 7.6: після успішної реєстрації — one-time мерж
        // localStorage-прогресу гостя в БД.
        await syncProgress();
        onSuccess();
      }
    } catch {
      setFormError("Не вдалося зареєструватися. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 id="auth-modal-title" className="font-serif text-[26px] leading-tight">
        <span className="text-accent-dark">Створи</span> акаунт
      </h2>
      <p className="mt-2 text-sm text-muted">
        Зареєструйся та отримай доступ до всіх безкоштовних уроків
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="register-firstname"
            label="Ім'я"
            icon={<UserIcon size={16} />}
            placeholder="Введи своє ім'я"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <Input
            id="register-lastname"
            label="Прізвище"
            icon={<UserIcon size={16} />}
            placeholder="Введи своє прізвище"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.lastName}
            autoComplete="family-name"
          />
        </div>

        <Input
          id="register-email"
          label="Email"
          type="email"
          icon={<MailIcon size={16} />}
          placeholder="Введи свій email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />

        <div>
          <Input
            id="register-password"
            label="Пароль"
            type="password"
            icon={<LockIcon size={16} />}
            placeholder="Створи пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
          />
          {!errors.password && (
            <p className="mt-1.5 text-xs text-muted">Мінімум 6 символів</p>
          )}
        </div>

        <div>
          <Input
            id="register-confirm-password"
            label="Підтвердження паролю"
            type="password"
            icon={<LockIcon size={16} />}
            placeholder="Підтверди пароль"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          {!errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-muted">Паролі повинні збігатися</p>
          )}
        </div>

        <div>
          <Checkbox
            id="agree-terms"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            label={
              <span>
                Я погоджуюсь з{" "}
                <a href="#" className="text-accent-dark hover:underline">
                  Умовами використання
                </a>{" "}
                та{" "}
                <a href="#" className="text-accent-dark hover:underline">
                  Політикою конфіденційності
                </a>
              </span>
            }
          />
          {errors.agree && <p className="mt-1.5 text-xs text-danger">{errors.agree}</p>}
        </div>

        {formError && <p className="text-sm text-danger">{formError}</p>}

        <Button
          type="submit"
          fullWidth
          icon={<ArrowRightIcon size={18} />}
          loading={loading}
        >
          Зареєструватись
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
        Зареєструватись через Google
      </Button>

      <p className="mt-6 text-center text-sm text-muted">
        Вже маєш акаунт?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-medium text-accent-dark hover:underline"
        >
          Увійти
        </button>
      </p>
    </div>
  );
}
