import type { NextAuthConfig } from "next-auth";

// "Запам'ятати мене" (задача 2.15): базова тривалість сесії — 30 днів
// (постійна кука), як для позначеного чекбоксу. Коли чекбокс не позначений,
// `loginUserAction` перезаписує cookie сесії без `maxAge`/`expires` одразу
// після `signIn`, перетворюючи її на сесійну (видаляється при закритті
// браузера) — див. `modules/auth/actions.ts`.
export const REMEMBER_ME_MAX_AGE = 60 * 60 * 24 * 30; // 30 днів у секундах

export const authConfig = {
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
    maxAge: REMEMBER_ME_MAX_AGE,
  },
  callbacks: {
    // Задача 3+.0.2 (TASKS_DETAILED.md): сесія — JWT-стратегія, тобто
    // `avatarUrl`/`email`/`nickname` "запечені" в токен лише на момент
    // логіну (гілка `if (user)` нижче). Без окремої обробки `trigger ===
    // "update"` зміна фото/email на `/settings` (3+.1–3+.2) відбудеться в
    // БД, але `Header`/`AccountButton`/`AccountLayout` (усі беруть дані з
    // `useSession()`) показуватимуть старі значення до наступного
    // релогіну. Клієнт після успішної дії викликає `useSession().update({
    // avatarUrl: newUrl })` / `.update({ email: newEmail })`
    // (`next-auth/react`) — це і є другий аргумент `session` тут, з
    // яким прийшов виклик `update()`, що NextAuth підкладає в колбек
    // разом із `trigger === "update"`. Мержимо лише ті поля, які
    // прийшли (кожне — за потреби конкретної підзадачі 3+.1/3+.2/3+.3,
    // якій воно потрібне), не чіпаючи решту токена.
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl;
        token.nickname = (user as { nickname?: string }).nickname;
      }

      if (trigger === "update" && session) {
        const update = session as {
          avatarUrl?: string | null;
          email?: string;
          nickname?: string | null;
        };
        if (typeof update.avatarUrl !== "undefined") {
          token.avatarUrl = update.avatarUrl;
        }
        if (typeof update.email !== "undefined") {
          token.email = update.email;
        }
        if (typeof update.nickname !== "undefined") {
          token.nickname = update.nickname;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { avatarUrl?: string }).avatarUrl = token.avatarUrl as string;
        (session.user as { nickname?: string }).nickname = token.nickname as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
