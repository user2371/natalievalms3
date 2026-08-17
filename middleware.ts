import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// middleware.ts виконується в Edge Runtime, де недоступні нативні модулі
// (bcryptjs, Prisma Client з рушієм БД). Тому тут НЕ можна імпортувати
// `auth` з повного `@/auth` (там `CredentialsProvider` з `authorize`,
// що тягне `modules/auth/service.ts` → `bcryptjs`/`prisma` — це зламало б
// білд/рантайм мідлвари). Замість цього використовується edge-safe
// `authConfig` (без провайдерів, лише JWT-колбеки для читання токена) —
// саме для цього він і задокументований окремим файлом `auth.config.ts`.
const { auth } = NextAuth(authConfig);

// Приватні розділи кабінету, що вимагають реальної сесії (задача 2.18).
// Решта сторінок кабінету (`/settings`, `/homework`, `/certificates`,
// `/users/[id]`) поки лишаються на локальному демо-тоглі `loggedIn` — за
// планом задачі 2.18 тут мали захищатись лише `/my-learning` і `/profile`,
// решту не чіпаємо в межах Фази 2.
const PROTECTED_ROUTES = ["/profile", "/my-learning"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = (req.auth?.user as { role?: string } | undefined)?.role;

  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`),
  );

  if (isAdminRoute) {
    if (!isLoggedIn || userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (isProtectedRoute && !isLoggedIn) {
    // Редірект на головну з відкриттям AuthModal (замість окремої
    // сторінки логіну — Auth лишається модальним вікном, CLAUDE.md).
    const redirectUrl = new URL("/", nextUrl);
    redirectUrl.searchParams.set("authModal", "login");
    redirectUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*", "/my-learning/:path*"],
};
