import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Моє навчання",
  description:
    "Твій прогрес проходження курсів Natalieva — уроки, квізи та здані домашні завдання.",
};

export default function MyLearningLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
