"use client";

import { useSession } from "next-auth/react";
import { useUnreadMessagesCount } from "@/lib/realtime/useUnreadMessagesCount";

/**
 * `components/messages/UnreadMessagesPoller.tsx` — ФАЗА MSG+, задача
 * MSG+.8.1 (08.09.2026, за прямим проханням користувача — "зроби такий
 * самий кружечок але в хедері і на всіх сторінках").
 *
 * Єдина мета цього компонента — змонтувати `useUnreadMessagesCount`
 * ОДИН РАЗ, високо в дереві (`app/layout.tsx`, поруч із
 * `ProgressSyncToast`/`AuthModalAutoOpen`), точно так, як і планувалось
 * у самому хуку ще з MSG+.2.4 ("⚠️ сама точка виводу бейджа НЕ
 * підключена в цій задачі... монтується один раз, високо в дереві").
 * Сам компонент нічого не рендерить (`return null`) — значення пише в
 * `messagesSlice.unreadTotal` (RTK), звідки Header (MSG+.8.1) і
 * AccountSidebar/AccountMobileNav (MSG+.2.4/.3.1, без змін) читають
 * його через `useAppSelector`, кожен незалежно.
 *
 * До цієї задачі поллінг був змонтований лише всередині `AccountLayout`
 * (тобто лише на сторінках кабінету — `/profile`, `/my-learning`,
 * `/homework`, `/certificates`, `/settings`). Тепер, коли бейдж
 * з'являється в Header на СТАТУТНО БУДЬ-ЯКІЙ сторінці (лендінг,
 * `/courses`, `/lessons/[slug]`, `/leaderboard` тощо — усі вони
 * рендерять `<Header />` без `AccountLayout`), єдина точка монтування
 * переїхала сюди; `AccountLayout` більше НЕ викликає сам хук (щоб не
 * було двох незалежних `setInterval`-поллінгів одночасно) — лише читає
 * те саме значення через `useAppSelector`.
 */
export function UnreadMessagesPoller() {
  const { status } = useSession();
  useUnreadMessagesCount(status === "authenticated");
  return null;
}
