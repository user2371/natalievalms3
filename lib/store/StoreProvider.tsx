"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "@/lib/store/store";

/**
 * Один `store` на весь застосунок (не per-request, як зазвичай радять для
 * SSR-фреймворків з реальними серверними даними в сторі) — свідомо: увесь
 * стан тут суто клієнтський (`localStorage`-дзеркала + UI-стан модалки),
 * нічого не рендериться на сервері з цих slice'ів, тому per-request store
 * (з фабрикою в `useRef`) не потрібен і лише ускладнив би код.
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
