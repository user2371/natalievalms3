import { ConfirmEmailClient } from "@/components/account/ConfirmEmailClient";

interface ConfirmEmailPageProps {
  searchParams: Promise<{ token?: string }>;
}

/**
 * `/settings/confirm-email` — Фаза 3+, задача 3+.2.3.
 *
 * Призначення посилання з листа-підтвердження зміни email
 * (`${NEXT_PUBLIC_APP_URL}/settings/confirm-email?token=...`,
 * `lib/email/emailChangeMail.ts`). Навмисно ПОЗА `AccountLayout`/
 * `GuestGate` (на відміну від решти `/settings`) — посилання може бути
 * відкрите в будь-якому контексті: інша вкладка, інший пристрій, навіть
 * без активної сесії в цьому браузері (див. коментар у
 * `modules/account/actions.ts` над `confirmEmailChangeAction` — токен
 * сам по собі достатній доказ, сесія тут не перевіряється).
 *
 * Сервер лише дістає `token` із query-рядка (Next.js 15 App Router —
 * `searchParams` як `Promise`, той самий патерн, що вже `params` на
 * `/courses/[slug]`) і передає клієнтському компоненту
 * (`ConfirmEmailClient`), якому потрібен `useSession().update(...)`
 * (3+.2.6) — недоступний у серверному компоненті.
 */
export default async function ConfirmEmailPage({ searchParams }: ConfirmEmailPageProps) {
  const { token } = await searchParams;
  return <ConfirmEmailClient token={token ?? null} />;
}
