"use server";

import { auth } from "@/auth";
import { signSupabaseRealtimeToken } from "./supabaseRealtimeToken";

/**
 * `lib/realtime/actions.ts` — ФАЗА MSG+, задача MSG+.2.1 (03.09.2026).
 * Окремий server action поза `modules/messages/actions.ts` навмисно —
 * це інфраструктурний міст (Auth.js → Supabase Realtime), не бізнес-дія
 * над повідомленнями, і потенційно знадобиться поза MSG+ (напр. майбутній
 * Realtime для інших фіч), тож не прив'язаний до модуля `messages`.
 *
 * `userId` — ЛИШЕ з сесії (`auth()`), той самий принцип, що й у
 * `modules/messages/actions.ts` — токен видається на конкретного юзера,
 * а не на будь-який `userId`, який міг би підсунути клієнт.
 */
export async function getRealtimeBridgeTokenAction() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      throw new Error("Потрібно увійти, щоб підписатись на оновлення в реальному часі");
    }

    const token = await signSupabaseRealtimeToken(userId);
    return { success: true as const, token, error: null };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Не вдалося отримати токен для реального часу";
    return { success: false as const, token: null, error: message };
  }
}
