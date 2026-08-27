import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateUserCredentials } from "@/modules/auth/service";
import { authConfig } from "@/auth.config";
import { findUserById } from "@/modules/auth/repository";
import { verifyPostRegistrationToken } from "@/lib/auth/postRegistrationToken";

// Повна (Node.js-рантайм) конфігурація Auth.js: розширює edge-safe
// `authConfig` (session/jwt/session-колбеки, вже описані там один раз),
// додаючи провайдер з `authorize`, що звертається до Prisma/bcrypt — це
// можна робити лише поза Edge Runtime (server actions, route handlers),
// саме тому `middleware.ts` використовує `authConfig` напряму, а не цей
// файл.
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        // F.26 (27.08.2026): третє, окреме "поле" облікових даних —
        // не показується в жодній формі, використовується лише
        // програмно з `verifyRegistrationCodeAction` одразу після
        // підтвердження email кодом (див. `authorize()` нижче й
        // `lib/auth/postRegistrationToken.ts`).
        registrationToken: { label: "Registration Token", type: "text" },
      },
      async authorize(credentials) {
        // F.26: авто-логін одразу після підтвердження email кодом —
        // БЕЗ пароля (пароль ніде не тримається в клієнтському стані
        // між кроком реєстрації й кроком вводу коду, рішення по
        // відкритому питанню F.26.9.1). Замість пароля — короткоживучий
        // (2 хв) підписаний токен, виданий сервером одразу після
        // реального підтвердження володіння поштою.
        if (credentials?.registrationToken) {
          const payload = await verifyPostRegistrationToken(
            String(credentials.registrationToken),
          );
          if (!payload) return null;

          const user = await findUserById(payload.userId);
          if (!user) return null;

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`,
            role: user.role,
            avatarUrl: user.avatarUrl,
            nickname: user.nickname,
          };
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const email = String(credentials.email);
        const password = String(credentials.password);
        const user = await validateUserCredentials(email, password);
        if (!user) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`,
          role: user.role,
          avatarUrl: user.avatarUrl,
          nickname: user.nickname,
        };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
});
