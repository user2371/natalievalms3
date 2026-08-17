"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

/** Скільки максимум тримати оверлей, навіть якщо `pathname` з якоїсь
 * причини не змінився (напр. користувач клікнув посилання на ту саму
 * сторінку з іншим scroll-якорем, або сталась помилка навігації) —
 * запобіжник, щоб прелоадер не завис "назавжди". */
const SAFETY_TIMEOUT_MS = 15_000;

/**
 * Задача (04.08.2026, за проханням користувача): на головній, у секції
 * "Програма курсу", клік по уроку відчувався як "зависання" — довга
 * пауза без жодної реакції, і лише потім на мить блимав `app/loading.tsx`
 * перед самим уроком. Причина: `app/loading.tsx` (Suspense fallback)
 * з'являється лише коли Next.js вже отримав від сервера бодай початок
 * відповіді для нового маршруту ("loading phase" — after URL updates).
 * А до цього моменту є ще "pending phase" (from click until URL
 * updates) — саме вона й відчувалась як зависання, бо в ній нічого не
 * рендериться.
 *
 * Цей компонент закриває саме "pending phase": ловить клік по будь-якому
 * внутрішньому `<a>` (в т.ч. усі `next/link` в проєкті — `RealLessonCard`,
 * `LessonCard`, `Header`, картки курсів тощо) ще ДО того, як Next.js
 * встигає щось відрендерити, і одразу показує той самий `Spinner`, що і
 * `app/loading.tsx`/`app/admin/loading.tsx`. Ховається сам, щойно
 * `pathname`/`searchParams` справді змінюються (тобто "loading phase"
 * почалась і естафету вже прийняв `loading.tsx` або готовий контент) —
 * тож користувач бачить один безперервний прелоадер від кліку і до
 * повного завантаження сторінки, без "мертвої" паузи на початку.
 */
export function RouteTransitionOverlay() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Маршрут "доїхав" (URL оновився) — ховаємо, естафету приймає
  // loading.tsx конкретного сегмента або вже готовий контент. Це "adjusting
  // state when a prop changes" (react.dev), тож робимо це під час рендеру,
  // а не в ефекті — інакше `react-hooks/set-state-in-effect` слушно лається
  // на потенційний каскад рендерів.
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [settledRouteKey, setSettledRouteKey] = useState(routeKey);
  if (routeKey !== settledRouteKey) {
    setSettledRouteKey(routeKey);
    if (isNavigating) setIsNavigating(false);
  }

  useEffect(() => {
    if (!isNavigating) return;
    const timeout = window.setTimeout(() => setIsNavigating(false), SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [isNavigating]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      // Тільки звичайний лівий клік без модифікаторів — Ctrl/Cmd/Shift/Alt
      // і середня кнопка відкривають нову вкладку, там прелоадер не потрібен.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // Зовнішнє посилання — не наша навігація, оверлей не показуємо.
      if (url.origin !== window.location.origin) return;

      // Той самий шлях (напр. лише якір на поточній сторінці) — теж пропускаємо.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      setIsNavigating(true);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!isNavigating) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Завантаження сторінки"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-cream/70 backdrop-blur-[1px] animate-auth-fade-in"
    >
      <Spinner size="lg" />
    </div>
  );
}
