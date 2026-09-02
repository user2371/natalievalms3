import { LockIcon } from "@/components/ui/icons";
import { PayCourseButton } from "./PayCourseButton";

/**
 * `components/course/PaywallNotice.tsx` — ФАЗА PAID+, задача PAID+.3.5
 * (02.09.2026, за прямим проханням користувача). Один спільний
 * компонент-заглушка для ДВОХ місць гейтингу (задача PAID+.3): лендінгу
 * курсу (`app/courses/[slug]/page.tsx`, замість кнопки "Почати
 * навчання") і сторінки уроку (`app/courses/[slug]/lessons/[lessonId]/
 * page.tsx`, замість відео/статті/квізу/домашнього завдання) — щоб
 * текст і стиль заглушки не розходились між двома місцями.
 *
 * ОНОВЛЕНО (ФАЗА PAID+, задача PAID+.4.1, 02.09.2026, за прямим
 * проханням користувача) — платіжний провайдер (LiqPay) підключено,
 * тому кнопка "Оплатити" (`PayCourseButton`) тепер рендериться, коли
 * причина показу — саме відсутність покупки (`courseId` передано і
 * `requiresAuth === false`); для гостя (`requiresAuth === true`) кнопки
 * й далі немає — оплату не можна прив'язати без `userId`
 * (`modules/access/service.ts::hasCourseAccessService`, PAID+.1.1), тому
 * текст лишається "Увійдіть у свій акаунт…" без дії.
 * `courseId` — необов'язковий проп: страховка на випадок виклику
 * компонента без нього (кнопка тоді просто не рендериться, а не падає),
 * а не ознака того, що якийсь із варіантів (`landing`/`lesson`) кнопки
 * не потребує — обидва потребують однаково.
 */
export interface PaywallNoticeProps {
  priceUAH: number | null;
  variant?: "landing" | "lesson";
  /** `true`, коли причина показу — відсутність сесії (гість), а не просто відсутність покупки. */
  requiresAuth?: boolean;
  /** Потрібен для кнопки "Оплатити" (`PayCourseButton`) — без нього кнопка не рендериться. */
  courseId?: string;
}

export function PaywallNotice({
  priceUAH,
  variant = "landing",
  requiresAuth = false,
  courseId,
}: PaywallNoticeProps) {
  return (
    <div
      className={
        variant === "landing"
          ? "mt-7 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-rose-line/60 bg-cream-soft/40 px-6 py-6"
          : "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-rose-line/60 bg-cream-soft/40 px-6 py-14 text-center"
      }
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
        <LockIcon size={18} />
      </span>
      <div>
        <p className="font-serif text-lg text-ink">Курс платний</p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          {requiresAuth
            ? "Увійдіть у свій акаунт, щоб отримати доступ до цього курсу після оплати."
            : "Оплатіть курс, щоб отримати повний доступ до уроків."}
          {priceUAH != null && (
            <>
              {" "}
              Вартість курсу: <span className="font-medium text-ink">{priceUAH} грн</span>.
            </>
          )}
        </p>
      </div>
      {!requiresAuth && courseId && (
        <PayCourseButton
          courseId={courseId}
          className={variant === "landing" ? "mt-1" : "mt-2"}
        />
      )}
    </div>
  );
}
