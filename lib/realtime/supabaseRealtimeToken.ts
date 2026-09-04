import { SignJWT } from "jose";

/**
 * `lib/realtime/supabaseRealtimeToken.ts` — ФАЗА MSG+, задача MSG+.2.1/.2.2
 * (03.09.2026). Реалізує рішення MSG+.2.2: Realtime Authorization одразу в
 * MVP (не проміжний "непередбачуваність UUID" варіант) — приватні розмови
 * захищені RLS-політиками на рівні бази (`ConversationParticipant`, див.
 * `prisma/migrations/20260903110000_messages_realtime_rls/`), а не
 * припущенням, що `conversationId` (UUID) неможливо вгадати.
 *
 * Проєкт використовує Auth.js (не Supabase Auth) — `auth()`-сесія НЕ є
 * Supabase-сесією і сама по собі не дає права підписатись на приватний
 * Realtime-канал/Postgres Changes з RLS. Міст: короткоживучий (60с — рівно
 * стільки, скільки треба клієнту, щоб відкрити з'єднання одразу після
 * видачі, той самий принцип мінімального TTL, що вже в
 * `lib/auth/postRegistrationToken.ts`, 2 хв) JWT, підписаний ТИМ САМИМ
 * секретом, що налаштований у Supabase-проєкті як JWT Secret (Project
 * Settings → API → JWT Settings → "Legacy JWT Secret" чи еквівалент
 * поточного UI Supabase). Це стандартний спосіб "bring your own auth" для
 * Supabase — Realtime/PostgREST перевіряють підпис і довіряють claim'ам
 * (`sub`, `role`) незалежно від того, хто видав токен, доки підпис valid.
 *
 * ⚠️ НЕ переплутати з `AUTH_SECRET` (`auth.ts`, підписує сесію Auth.js) —
 * це ДВА РІЗНІ секрети з різним призначенням. `SUPABASE_JWT_SECRET` треба
 * скопіювати з Supabase Dashboard і покласти в `.env` окремим значенням.
 * Використання `AUTH_SECRET` тут (навіть якщо технічно спрацювало б,
 * бо це просто рядок для HMAC) було б плутаниною призначень і зайвою
 * зв'язністю: ротація одного секрету не повинна ламати інший.
 *
 * Нові env-змінні (MSG+.2.1), поруч із наявними секціями Cloudinary/
 * Resend/LiqPay (`lib/storage/*.ts`, `lib/email/*.ts`, `lib/payments/liqpay.ts`):
 * - `SUPABASE_JWT_SECRET` — серверний секрет, підписує міст-токен нижче.
 * - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — публічні,
 *   для клієнтського підключення до Realtime (`lib/realtime/supabaseClient.ts`).
 *
 * Перевірка недоступна в пісочниці (немає мережі до реального Supabase-
 * проєкту користувача, той самий відомий виняток, що й `prisma migrate
 * dev`/`npm install` у попередніх фазах) — потребує ручної перевірки
 * користувачем локально/на CI з реальними Supabase-креденшелами.
 */

const SUPABASE_BRIDGE_TOKEN_TTL = "60s";

function getSupabaseJwtSecret(): Uint8Array {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error("SUPABASE_JWT_SECRET не налаштовано");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Підписує міст-токен для конкретного `userId` (з `session.user.id`,
 * ніколи з клієнта напряму — викликається лише зсередини серверного
 * `getMessagesRealtimeTokenAction`, `lib/realtime/actions.ts`).
 *
 * Claims: `sub` — те, що читає `auth.uid()` у Postgres RLS-політиках
 * (`current_setting('request.jwt.claims', true)::json->>'sub'`, той самий
 * механізм, яким Supabase резолвить `auth.uid()` незалежно від того, хто
 * видав токен); `role: "authenticated"` — Supabase-конвенція ролі
 * (відрізняє від анонімного `role: "anon"`), потрібна, щоб Realtime/
 * PostgREST застосували політики, написані для `authenticated`, а не
 * `anon`.
 */
export async function signSupabaseRealtimeToken(userId: string): Promise<string> {
  return new SignJWT({ role: "authenticated" })
    .setSubject(userId)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SUPABASE_BRIDGE_TOKEN_TTL)
    .sign(getSupabaseJwtSecret());
}
