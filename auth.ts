import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { validateUserCredentials } from "@/modules/auth/service";
import { authConfig } from "@/auth.config";

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
      },
      async authorize(credentials) {
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
