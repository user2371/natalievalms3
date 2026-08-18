import { ResetPasswordClient } from "@/components/auth/ResetPasswordClient";
export const dynamic = 'force-dynamic'
interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * `/reset-password` — Фаза FIXES, задача F.20 ("Забув пароль" при
 * логіні). Призначення посилання з листа скидання пароля
 * (`${NEXT_PUBLIC_APP_URL}/reset-password?token=...`,
 * `lib/email/passwordResetMail.ts`). Той самий шаблон, що
 * `app/settings/confirm-email/page.tsx` (задача 3+.2.3) — навмисно
 * ПОЗА будь-яким `AccountLayout`/`GuestGate`: посилання відкривають
 * саме тому, що користувач НЕ може увійти (не пам'ятає пароль), тож
 * сторінка мусить бути доступна без сесії.
 *
 * Сервер лише дістає `token` із query-рядка (Next.js 15 App Router,
 * `searchParams` як `Promise` — той самий патерн, що вже на
 * `/courses/[slug]` і `/settings/confirm-email`) і передає клієнтському
 * компоненту (`ResetPasswordClient`), якому потрібні `useState`-форма
 * нового пароля й `useAuthModal()` (відкриття `AuthModal` на екрані
 * "login" після успіху) — недоступні в серверному компоненті.
 */
export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { token } = await searchParams;
  return <ResetPasswordClient token={token ?? null} />;
}
