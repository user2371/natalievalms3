"use client";

import { ReactNode, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { authModalScreenSet } from "@/lib/store/slices/authModalSlice";
import { AuthModal, type AuthScreen } from "@/components/auth/AuthModal";

export type { AuthScreen };

interface AuthModalContextValue {
  screen: AuthScreen | null;
  openAuthModal: (screen?: AuthScreen) => void;
  closeAuthModal: () => void;
}

/**
 * 23.07.2026: раніше — React Context (`createContext` + `useState` у
 * `AuthModalProvider`). Перенесено на Redux Toolkit
 * (`lib/store/slices/authModalSlice.ts`) — стан модалки авторизації читають
 * і пишуть 6 незв'язаних компонентів (`Header`, `GuestGate`,
 * `CommentsBlock`, `HomeworkBlock`, `AuthModalAutoOpen`), тобто це
 * кросскомпонентний UI-стан, природний кандидат на глобальний store, а не
 * контекст одного піддерева.
 *
 * Назва хука й шлях файлу лишені незмінними навмисно — усі 6 споживачів
 * імпортують саме `useAuthModal` з `@/components/auth/AuthModalContext` і
 * НЕ потребували жодних правок при цьому переході.
 */
export function useAuthModal(): AuthModalContextValue {
  const dispatch = useAppDispatch();
  const screen = useAppSelector((state) => state.authModal.screen);

  const openAuthModal = useCallback(
    (next: AuthScreen = "login") => dispatch(authModalScreenSet(next)),
    [dispatch],
  );
  const closeAuthModal = useCallback(
    () => dispatch(authModalScreenSet(null)),
    [dispatch],
  );

  return { screen, openAuthModal, closeAuthModal };
}

/**
 * Рендерить саму модалку авторизації один раз у корені дерева
 * (`app/layout.tsx`). Стан більше не передається через `<Context.Provider
 * value={...}>` — Redux store вже доступний глобально через
 * `<StoreProvider>` (обгортає `<AuthModalProvider>` в `app/layout.tsx`),
 * тому цей компонент лишається тонкою обгорткою, що просто рендерить
 * `<AuthModal>` поряд з дітьми — заради зворотної сумісності імпорту в
 * `app/layout.tsx` (нуль правок там при цьому переході).
 */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const { screen, openAuthModal, closeAuthModal } = useAuthModal();

  return (
    <>
      {children}
      <AuthModal screen={screen} onClose={closeAuthModal} onSwitch={openAuthModal} />
    </>
  );
}
