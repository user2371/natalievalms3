"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { MailIcon, ArrowRightIcon } from "@/components/ui/icons";
import { useProgressSync } from "@/lib/progress/useProgressSync";
import { verifyRegistrationCodeAction, resendRegistrationCodeAction } from "@/modules/auth";

export interface VerifyEmailScreenProps {
  email: string;
  /** Кнопка "Змінити email" — повертає на форму реєстрації (`register`). */
  onChangeEmail: () => void;
  onSuccess: () => void;
}

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * `VerifyEmailScreen` — Фаза FIXES, задача F.26 (підтвердження email
 * кодом перед реєстрацією). Четвертий екран `AuthModal`, крок 2 флоу
 * реєстрації (після `RegisterScreen`): 6-значний код із листа →
 * `verifyRegistrationCodeAction` → щойно тепер реально створюється
 * `User` і виконується авто-логін (сервер сам звіряє код і сам логінить
 * через короткоживучий токен, `lib/auth/postRegistrationToken.ts` —
 * пароль на цьому екрані НІКОЛИ не потрібен, рішення по F.26.9.1).
 *
 * `updateSession()`/`syncProgress()` — той самий фікс і той самий
 * one-time мерж гостьового прогресу (задача 7.6), що раніше виконувались
 * одразу в `RegisterScreen` — переїхали сюди, бо саме тут тепер
 * відбувається реальний вхід у систему.
 */
export function VerifyEmailScreen({ email, onChangeEmail, onSuccess }: VerifyEmailScreenProps) {
  const { update: updateSession } = useSession();
  const { syncProgress } = useProgressSync();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^\d{6}$/.test(code.trim())) {
      setError("Код має складатися з 6 цифр");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyRegistrationCodeAction({ email, code: code.trim() });
      if (!res.success) {
        setError(res.error || "Не вдалося підтвердити код. Спробуйте ще раз.");
      } else {
        // Той самий фікс, що вже був у RegisterScreen/LoginScreen: після
        // авто-логіну на сервері потрібен явний рефетч клієнтської сесії
        // (задача 2.14).
        await updateSession();
        // Задача 7.6: one-time мерж localStorage-прогресу гостя в БД.
        await syncProgress();
        onSuccess();
      }
    } catch {
      setError("Не вдалося підтвердити код. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendMessage(null);
    setError(null);
    setResending(true);
    try {
      const res = await resendRegistrationCodeAction({ email });
      if (res.success) {
        setResendMessage("Новий код надіслано на пошту.");
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        setResendMessage(res.error || "Не вдалося надіслати код повторно.");
      }
    } catch {
      setResendMessage("Не вдалося надіслати код повторно.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <h2 id="auth-modal-title" className="font-serif text-[26px] leading-tight">
        <span className="text-accent-dark">Підтвердь</span> email
      </h2>
      <p className="mt-2 text-sm text-muted">
        Ми надіслали 6-значний код на {email}. Введи його нижче, щоб завершити
        реєстрацію.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 flex flex-col gap-4">
        <Input
          id="verify-email-code"
          label="Код підтвердження"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          icon={<MailIcon size={16} />}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          error={error ?? undefined}
        />

        <Button type="submit" fullWidth icon={<ArrowRightIcon size={18} />} loading={loading}>
          Підтвердити
        </Button>
      </form>

      {resendMessage && <p className="mt-4 text-sm text-muted">{resendMessage}</p>}

      <p className="mt-6 text-center text-sm text-muted">
        Не прийшов код?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="font-medium text-accent-dark hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {cooldown > 0 ? `Надіслати ще раз (${cooldown}с)` : "Надіслати ще раз"}
        </button>
      </p>

      <p className="mt-2 text-center text-sm text-muted">
        Помилились в адресі?{" "}
        <button
          type="button"
          onClick={onChangeEmail}
          className="font-medium text-accent-dark hover:underline"
        >
          Змінити email
        </button>
      </p>
    </div>
  );
}
