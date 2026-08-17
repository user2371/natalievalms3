import type { ReactNode } from "react";
import type { Metadata } from "next";

/** Приватна сторінка налаштувань — robots noindex, той самий принцип, що й `/profile`/`/admin`. */
export const metadata: Metadata = {
  title: "Налаштування",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
