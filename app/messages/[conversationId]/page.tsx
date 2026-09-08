"use client";

import { use } from "react";
import { useSession } from "next-auth/react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { GuestGate } from "@/components/account/GuestGate";
import { MessagesSplitView } from "@/components/messages/MessagesSplitView";

export const dynamic = "force-dynamic";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

/**
 * `app/messages/[conversationId]/page.tsx` — ФАЗА MSG+, задача MSG+.7.7
 * (редизайн `/messages` під спліт-в'ю макет `chatMockup.png`, за прямим
 * проханням користувача, 07.09.2026).
 *
 * Раніше (MSG+.3.2) цей маршрут був повноекранним чатом з ВЛАСНИМ, легшим
 * каркасом (лише `Header`, без сайдбару кабінету) — свідоме рішення того
 * часу, щоб не дублювати навігацію й не забирати вертикальний простір
 * нижньою мобільною панеллю. Макет `chatMockup.png` показує чат УСЕРЕДИНІ
 * звичного кабінету (сайдбар зліва завжди видимий, як на `/profile` тощо),
 * тож ця задача свідомо ПОВЕРТАЄ `AccountLayout` і сюди — той самий
 * каркас, що тепер і на `/messages` (MSG+.7.6). Причина, що раніше
 * тримала екран легшим (нижня мобільна панель забирала простір під полем
 * вводу), вирішена інакше: на мобільному видно РІВНО одну панель
 * спліт-в'ю (`MessagesSplitView`) — список АБО чат, ніколи обидва, тож
 * `AccountMobileNav` більше не конкурує з полем вводу за висоту так, як
 * конкурувала б повна історія чату впритул до нижньої панелі.
 *
 * Уся логіка самого чату (історія, Realtime, надсилання, блокування,
 * скарги) — у `ChatPanel` (MSG+.7.4), змонтованому через
 * `MessagesSplitView` з `activeConversationId={conversationId}`. Ця
 * сторінка більше не робить власного `listConversationsAction`-виклику
 * заради "хто співрозмовник" — `MessagesSplitView` вже завантажує список
 * розмов для лівої панелі й перевикористовує ті самі дані (див. коментар
 * у `MessagesSplitView.tsx`).
 */
export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const { status } = useSession();

  if (status === "unauthenticated") {
    return <GuestGate description="приватних повідомлень" />;
  }

  return (
    <AccountLayout description="приватних повідомлень">
      <MessagesSplitView activeConversationId={conversationId} />
    </AccountLayout>
  );
}
