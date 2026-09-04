import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Повідомлення",
  description: "Приватні повідомлення з іншими користувачами Natalieva LMS.",
};

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
