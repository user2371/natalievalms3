import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Message } from "@/modules/messages";

/**
 * `lib/store/slices/messagesSlice.ts` — ФАЗА MSG+, задачі MSG+.2.3/MSG+.2.4
 * (03.09.2026). Той самий підхід, що й `commentsSlice`/`progressSlice`
 * (`lib/store/store.ts`) — крос-компонентний клієнтський кеш, а не
 * джерело правди (джерело правди — БД через `modules/messages/*`).
 *
 * Два незалежні шматки стану, обидва навмисно НЕ синхронізуються з
 * `localStorage` (на відміну від `progress`/`homework`/`comments`) — це
 * лише live-кеш поточної вкладки, немає сенсу переживати перезавантаження
 * сторінки (список розмов і так підвантажується заново з сервера):
 *
 * - `messagesByConversation` — нові повідомлення, що прийшли по Realtime
 *   (MSG+.2.3, `useConversationRealtime`) під час відкритого екрана
 *   розмови. Екран розмови (MSG+.3.2, ще не реалізовано) читатиме історію
 *   через `listMessagesAction` і домержовуватиме з цим у порядку
 *   отримання; сам слайс не знає про пагінацію/курсори `listMessages`.
 * - `unreadTotal` — сумарний лічильник непрочитаних по всіх розмовах
 *   (MSG+.2.4, `useUnreadMessagesCount` — легкий поллінг
 *   `listConversationsAction`, той самий підхід \"без окремого підключення
 *   до кожної розмови одразу\", що описаний у плані MSG+.2.4). Читається
 *   через `useAppSelector` — куди саме вивести бейдж (нав меню) вирішить
 *   MSG+.3, коли з'явиться пункт навігації \"Повідомлення\"; сам лічильник
 *   готовий вже зараз.
 */
interface MessagesState {
  messagesByConversation: Record<string, Message[]>;
  unreadTotal: number;
  unreadHydrated: boolean;
}

const initialState: MessagesState = {
  messagesByConversation: {},
  unreadTotal: 0,
  unreadHydrated: false,
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    /** Нове повідомлення з Realtime-підписки конкретної розмови (`useConversationRealtime`, MSG+.2.3). */
    realtimeMessageReceived(
      state,
      action: PayloadAction<{ conversationId: string; message: Message }>,
    ) {
      const { conversationId, message } = action.payload;
      const existing = state.messagesByConversation[conversationId] ?? [];
      // Захист від дублю: Realtime-подія й ручний `sendMessageAction` (той
      // самий відправник, той самий екран) теоретично можуть привести до
      // того самого повідомлення двічі — той самий рівень обережності,
      // що й `findConversationBetween` (MSG+.1.1, задокументована гонка).
      if (existing.some((m) => m.id === message.id)) {
        return;
      }
      state.messagesByConversation[conversationId] = [...existing, message];
    },
    /** Очищає Realtime-кеш розмови (розмонтування екрана розмови, MSG+.2.3) — історію й так підвантажить `listMessagesAction` при наступному відкритті. */
    conversationRealtimeCacheCleared(state, action: PayloadAction<{ conversationId: string }>) {
      delete state.messagesByConversation[action.payload.conversationId];
    },
    /** Оновлює сумарний лічильник непрочитаних (поллінг `useUnreadMessagesCount`, MSG+.2.4). */
    unreadTotalSet(state, action: PayloadAction<number>) {
      state.unreadTotal = action.payload;
      state.unreadHydrated = true;
    },
  },
});

export const { realtimeMessageReceived, conversationRealtimeCacheCleared, unreadTotalSet } =
  messagesSlice.actions;
export default messagesSlice.reducer;
