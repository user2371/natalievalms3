"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { CloseIcon } from "@/components/ui/icons";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { RegisterScreen } from "@/components/auth/RegisterScreen";
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";
import { VerifyEmailScreen } from "@/components/auth/VerifyEmailScreen";

// Фаза FIXES, задача F.20: третій екран модалки — "Забув пароль".
// Фаза FIXES, задача F.26: четвертий екран — підтвердження email кодом
// (крок 2 реєстрації, після "register").
export type AuthScreen = "login" | "register" | "forgot-password" | "verify-email";

export interface AuthModalProps {
  screen: AuthScreen | null;
  onClose: () => void;
  onSwitch: (screen: AuthScreen) => void;
}

export function AuthModal({ screen, onClose, onSwitch }: AuthModalProps) {
  /**
   * Фаза FIXES, задача F.26. Проміжний email між кроком реєстрації
   * ("register") і кроком підтвердження коду ("verify-email") —
   * `AuthModal` монтується один раз у корені дерева
   * (`AuthModalContext.tsx`) і не перемонтовується при перемиканні
   * `screen`, тож локальний `useState` тут переживає перехід між
   * екранами. НАВМИСНО лише email, БЕЗ пароля — рішення по відкритому
   * питанню F.26.9.1 (`TASKS_DETAILED.md`): фінальний авто-логін після
   * підтвердження коду йде через короткоживучий серверний токен
   * (`verifyRegistrationCodeAction`/`lib/auth/postRegistrationToken.ts`),
   * а не через повторно введений пароль, тож пароль тут узагалі не
   * потрібен і ніколи не потрапляє в цей стан.
   */
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  function handleSwitchToVerify(email: string) {
    setPendingEmail(email);
    onSwitch("verify-email");
  }

  return (
    <Modal
      open={screen !== null}
      onClose={onClose}
      labelledBy="auth-modal-title"
      variant="sheet"
      className="max-w-[440px] p-0"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрити"
        className="absolute right-5 top-5 z-10 text-muted hover:text-ink"
      >
        <CloseIcon size={20} />
      </button>

      {/* key={screen} перезапускає CSS-анімацію при кожному перемиканні екрана */}
      <div key={screen} className="animate-auth-fade-in px-7 py-9 sm:px-9">
        {screen === "login" && (
          <LoginScreen
            onSwitchToRegister={() => onSwitch("register")}
            onSwitchToForgotPassword={() => onSwitch("forgot-password")}
            onSuccess={onClose}
          />
        )}
        {screen === "register" && (
          <RegisterScreen
            onSwitchToLogin={() => onSwitch("login")}
            onSwitchToVerify={handleSwitchToVerify}
          />
        )}
        {screen === "forgot-password" && (
          <ForgotPasswordScreen onSwitchToLogin={() => onSwitch("login")} />
        )}
        {screen === "verify-email" && pendingEmail && (
          <VerifyEmailScreen
            email={pendingEmail}
            onChangeEmail={() => onSwitch("register")}
            onSuccess={onClose}
          />
        )}
      </div>
    </Modal>
  );
}
