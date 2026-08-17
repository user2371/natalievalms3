"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthModal } from "@/components/auth/AuthModalContext";

/**
 * Відкриває `AuthModal`, коли middleware редіректить незалогіненого
 * відвідувача з приватної сторінки (`/profile`, `/my-learning`, задача
 * 2.18) на головну з `?authModal=login&callbackUrl=/profile`. Після
 * відкриття модалки прибирає query-параметри з адресного рядка, щоб
 * повторне відкриття сторінки в новій вкладці за цим URL не відкривало
 * модалку знову.
 *
 * `callbackUrl` поки не використовується для редіректу назад після логіну
 * (це вимагало б додаткової логіки в `AuthModal`/`onSuccess`, що виходить
 * за межі задачі 2.18) — просто відкриває модалку на головній.
 */
export function AuthModalAutoOpen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    const authModal = searchParams.get("authModal");
    if (authModal === "login" || authModal === "register") {
      openAuthModal(authModal);
      router.replace("/", { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return null;
}
