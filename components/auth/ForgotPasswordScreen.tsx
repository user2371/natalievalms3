"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MailIcon, ArrowRightIcon } from "@/components/ui/icons";
import { isValidEmail } from "@/lib/auth/validation";
import { requestPasswordResetAction } from "@/modules/auth";

export interface ForgotPasswordScreenProps {
  onSwitchToLogin: () => void;
}

/**
 * `ForgotPasswordScreen` — Фаза FIXES, задача F.20 ("Забув пароль" при
 * логіні). Третій екран `AuthModal` (поряд з `LoginScreen`/
 * `RegisterScreen`) — крок 1 флоу: лише email, кнопка "Надіслати
 * посилання". Той самий шаблон "форма → сабмішн → нейтральне
 * підтвердження замість самого результату", що вже в попапі "Змінити
 * email" на `/settings` (`emailSent`, задача 3+.2.5) — тут так само:
 * після сабміту показуємо коротке "Лист надіслано…", а не одразу
 * закриваємо модалку чи логінимо — сама зміна пароля ще попереду
 * (перехід за посиланням із листа, `/reset-password`).
 *
 * НАВМИСНО без `onSuccess`-проп (на відміну від `LoginScreen`/
 * `RegisterScreen`) — тут немає миттєвого логіну/закриття модалки,
 * лише перемикання назад на `login` кнопкою в самому екрані успіху.
 */
export function ForgotPasswordScreen({ onSwitchToLogin }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!isValidEmail(email)) {
      setError("Введіть коректний email");
      return;
    }
    setError(null);

    setLoading(true);
    try {
      const result = await requestPasswordResetAction({ email });
      if (result.success) {
        setSent(true);
      } else {
        setFormError(result.error || "Не вдалося надіслати лист");
      }
    } catch {
      setFormError("Не вдалося надіслати лист");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div>
        <h2 className="font-serif text-[26px] leading-tight">
          <span className="text-accent-dark">Лист</span> надіслано
        </h2>
        <p className="mt-2 text-sm text-muted">
          Якщо акаунт з адресою {email} існує, на неї надіслано лист із
          посиланням для скидання пароля. Посилання дійсне 30 хвилин.
        </p>

        <Button type="button" fullWidth className="mt-7" onClick={onSwitchToLogin}>
          Повернутися до входу
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-serif text-[26px] leading-tight">
        <span className="text-accent-dark">Забули</span> пароль?
      </h2>
      <p className="mt-2 text-sm text-muted">
        Введіть email, вказаний при реєстрації — надішлемо посилання для
        скидання пароля
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
        <Input
          id="forgot-password-email"
          label="Email"
          type="email"
          icon={<MailIcon size={16} />}
          placeholder="Введи свій email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error ?? undefined}
          autoComplete="email"
        />

        {formError && <p className="text-sm text-danger">{formError}</p>}

        <Button
          type="submit"
          fullWidth
          icon={<ArrowRightIcon size={18} />}
          loading={loading}
        >
          Надіслати посилання
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Згадали пароль?{" "}
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
