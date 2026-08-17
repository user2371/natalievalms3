import type { ReactNode } from "react";
import type { Metadata } from "next";

/**
 * Приватний кабінет (на відміну від публічного `/users/[id]`) — robots
 * noindex, той самий принцип, що й у `/admin` (задача 9.16).
 */
export const metadata: Metadata = {
  title: "Профіль",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
