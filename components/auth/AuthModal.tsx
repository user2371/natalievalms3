"use client";

import { Modal } from "@/components/ui/Modal";
import { CloseIcon } from "@/components/ui/icons";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { RegisterScreen } from "@/components/auth/RegisterScreen";
import { ForgotPasswordScreen } from "@/components/auth/ForgotPasswordScreen";

// Фаза FIXES, задача F.20: третій екран модалки — "Забув пароль".
export type AuthScreen = "login" | "register" | "forgot-password";

export interface AuthModalProps {
  screen: AuthScreen | null;
  onClose: () => void;
  onSwitch: (screen: AuthScreen) => void;
}

export function AuthModal({ screen, onClose, onSwitch }: AuthModalProps) {
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
          <RegisterScreen onSwitchToLogin={() => onSwitch("login")} onSuccess={onClose} />
        )}
        {screen === "forgot-password" && (
          <ForgotPasswordScreen onSwitchToLogin={() => onSwitch("login")} />
        )}
      </div>
    </Modal>
  );
}
