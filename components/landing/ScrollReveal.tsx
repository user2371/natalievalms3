"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Optional stagger — delays the transition start by this many ms. */
  delayMs?: number;
}

/**
 * ФАЗА SCROLL+, задача SCROLL+.1.1 (08.09.2026, прохання користувача —
 * "анімація на скролі" для контенту на головній: блоки ніби піднімаються
 * вгору під час прокрутки).
 *
 * `IntersectionObserver` додає клас `.is-visible` (див. `app/globals.css`,
 * `.scroll-reveal`) в момент, коли елемент вперше входить у viewport —
 * ОДИН РАЗ: спостерігач одразу відписується (`observer.unobserve`), тому
 * секція не "ховається" назад при скролі вгору й повторному вниз (типова
 * практика для такого ефекту — інакше анімація дратує при звичайній
 * навігації по сторінці).
 *
 * `rootMargin: "0px 0px -80px 0px"` — секція вважається "у viewport" за
 * 80px ДО того, як торкнеться нижнього краю екрана, щоб анімація
 * встигала завершитись, поки секція ще трохи нижче середини екрана
 * (природніше, ніж чекати, доки вона впреться в самий низ).
 *
 * SSR/відсутність `IntersectionObserver` (дуже старі браузери) →
 * одразу `isVisible = true`, контент просто видно без анімації, замість
 * "зламаного" вічно прихованого блоку.
 */
export function ScrollReveal({
  children,
  className,
  delayMs = 0,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`scroll-reveal${isVisible ? " is-visible" : ""}${
        className ? ` ${className}` : ""
      }`}
      style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
