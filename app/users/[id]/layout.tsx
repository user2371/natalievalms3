import type { ReactNode } from "react";
import type { Metadata } from "next";
import { getPublicProfileAction } from "@/modules/profile/actions";

interface UserLayoutProps {
  params: Promise<{ id: string }>;
}

/**
 * Задача 9.16: динамічний заголовок публічного профілю — на відміну від
 * `/profile` (приватний, noindex), цю сторінку МОЖНА й варто ділитись/
 * індексувати (портфоліо учениці, той самий принцип, що вже застосований у
 * `generateMetadata` `/courses/[slug]`, задача 3.22). Неіснуючий/помилковий
 * `id` — нейтральний фолбек-заголовок, без падіння (сам `notFound()` — у
 * тілі сторінки нижче, тут лише метадані, той самий підхід, що й на
 * `/courses/[slug]`).
 */
export async function generateMetadata({ params }: UserLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicProfileAction(id).catch(() => null);

  if (!result?.success) {
    return { title: "Профіль не знайдено" };
  }

  const description = `Профіль ${result.profile.name} на Natalieva LMS — прогрес курсів, бали та рейтинг.`;

  return {
    title: result.profile.name,
    description,
    openGraph: {
      title: result.profile.name,
      description,
      images: result.profile.avatarUrl ? [{ url: result.profile.avatarUrl }] : undefined,
    },
  };
}

export default function UserProfileLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
