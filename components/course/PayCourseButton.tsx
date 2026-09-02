"use client";

import { useState } from "react";
import { initiateCoursePurchaseAction } from "@/modules/payments";
import { LockIcon } from "@/components/ui/icons";

export interface PayCourseButtonProps {
  courseId: string;
  className?: string;
}

/**
 * `components/course/PayCourseButton.tsx` — ФАЗА PAID+, задача PAID+.4.1
 * (02.09.2026, за прямим проханням користувача). Єдина кнопка "Оплатити"
 * у проєкті — рендериться лише в `PaywallNotice` (`variant="landing"`,
 * і лише коли є сесія — гість бачить звичайний текст без кнопки, той
 * самий `requiresAuth`, що вже там).
 *
 * Клієнтський компонент (не серверна форма з `action={...}`) — LiqPay
 * очікує звичайний HTML POST із полями `data`/`signature` на СВІЙ хост
 * (`LIQPAY_CHECKOUT_URL`), а не на наш сервер, тому Next.js server
 * action тут лише готує ці два поля (`initiateCoursePurchaseAction`,
 * той самий контракт `{ success, error }`, що вже решта дій проєкту), а
 * власне редірект — звичайний `<form>.submit()` в браузері.
 */
export function PayCourseButton({ courseId, className }: PayCourseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setError(null);

    const result = await initiateCoursePurchaseAction(courseId);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Динамічна форма замість статичного `<form>` у розмітці — поля
    // `data`/`signature` відомі лише ПІСЛЯ відповіді server action
    // (кожен клік створює новий `CoursePurchase`/`providerOrderId`,
    // задача PAID+.4.3), тому їх не можна відрендерити заздалегідь.
    const form = document.createElement("form");
    form.method = "POST";
    form.action = result.checkoutUrl;
    form.style.display = "none";

    for (const [name, value] of [
      ["data", result.data],
      ["signature", result.signature],
    ] as const) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    // `loading` навмисно НЕ скидається тут — сторінка вже йде на
    // редірект до LiqPay, скидання спричинило б короткий "блимок"
    // кнопки назад у активний стан до того, як браузер встигне перейти.
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-dark disabled:opacity-60"
      >
        <LockIcon size={16} />
        {loading ? "Перенаправлення на оплату…" : "Оплатити курс"}
      </button>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
