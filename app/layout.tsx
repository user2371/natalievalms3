import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthModalProvider } from "@/components/auth/AuthModalContext";
import { AuthModalAutoOpen } from "@/components/auth/AuthModalAutoOpen";
import { RouteTransitionOverlay } from "@/components/layout/RouteTransitionOverlay";
import { ProgressSyncToast } from "@/components/progress/ProgressSyncToast";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { StoreProvider } from "@/lib/store/StoreProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext", "cyrillic"],
  display: "swap",
});

/**
 * Задача 9.16 (перевірка SEO-метаданих): `title.template` дає кожній
 * дочірній сторінці змогу задати лише короткий `title` (напр. "Каталог
 * курсів"), а Next.js сам підставить його в `%s — Natalieva LMS` — той
 * самий консистентний формат, що вже був вручну прописаний у
 * `generateMetadata` `/courses/[slug]` (задача 3.22) та
 * `/courses/[slug]/lessons/[lessonId]`. Сторінки без власного `title`
 * (ще не покриті цією задачею) і далі показують `title.default`.
 *
 * `metadataBase` — через `NEXT_PUBLIC_SITE_URL` (додати в `.env`/хостинг
 * перед релізом), а НЕ хардкод довільного домену: неправильний
 * захардкожений домен у `metadataBase` тихо зіпсує canonical/OG-URL у
 * продакшені (нічого не впаде, просто посилання вестимуть не туди), тож
 * безпечніший фолбек — `localhost` для розробки, доки реальний домен не
 * визначено.
 */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Natalieva LMS — Gel Polish & Nail Extensions",
    template: "%s — Natalieva LMS",
  },
  description:
    "Безкоштовний онлайн курс манікюру: відеоуроки, квізи та сертифікат від майстра Наталії.",
  openGraph: {
    type: "website",
    locale: "uk_UA",
    siteName: "Natalieva LMS",
    title: "Natalieva LMS — Gel Polish & Nail Extensions",
    description:
      "Безкоштовний онлайн курс манікюру: відеоуроки, квізи та сертифікат від майстра Наталії.",
    images: [{ url: "/heroBlockWide.png", width: 1806, height: 871 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Natalieva LMS — Gel Polish & Nail Extensions",
    description:
      "Безкоштовний онлайн курс манікюру: відеоуроки, квізи та сертифікат від майстра Наталії.",
    images: ["/heroBlockWide.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <StoreProvider>
          <SessionProvider>
            <AuthModalProvider>
              <Suspense fallback={null}>
                <AuthModalAutoOpen />
              </Suspense>
              <Suspense fallback={null}>
                <RouteTransitionOverlay />
              </Suspense>
              <ProgressSyncToast />
              {children}
            </AuthModalProvider>
          </SessionProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
