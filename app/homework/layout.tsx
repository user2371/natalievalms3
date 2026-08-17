import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Домашні завдання",
  description: "Список зданих і невиконаних домашніх завдань по курсах Natalieva.",
};

export default function HomeworkLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
