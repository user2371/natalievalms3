import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Мої сертифікати",
  description:
    "Сертифікати про проходження курсів Natalieva — завантажуй і ділись досягненнями.",
};

export default function CertificatesLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
