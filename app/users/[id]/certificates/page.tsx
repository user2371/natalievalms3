"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { AccountLayout } from "@/components/account/AccountLayout";
import { CertificatesPageContent } from "@/components/certificates/CertificatesPageContent";
import { getPublicProfileAction } from "@/modules/profile/actions";
import { getCertificatesForUserAction } from "@/modules/certificates";
import type { PublicProfile } from "@/modules/profile/service";
import type { CertificateEntry } from "@/modules/certificates";

interface UserCertificatesPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Публічна сторінка "Сертифікати" будь-якого користувача (`/users/[id]/
 * certificates`, задача 0.16) — доступна без авторизації, як і сам
 * `/users/[id]`. Кнопка "Показати всі" в секції "Сертифікати" на профілі
 * (власному чи чужому) веде саме сюди, коли сертифікатів більше 5.
 *
 * 02.08.2026, виправлення (той самий баг, що був на `/users/[id]` і
 * `/profile`): "свій/чужий" визначався порівнянням із хардкодженим
 * `DEMO_PROFILE.id`, а не реальною сесією, і для чужого профілю ім'я
 * бралось зі статичного `getPublicProfile` (`lib/data/profile.ts`,
 * `DEMO_PUBLIC_PROFILES`) — для реального `userId` це майже завжди 404,
 * навіть якщо профіль насправді існує в БД. Тепер обидві гілки — реальне
 * ім'я через `getPublicProfileAction` (`modules/profile`). Самі сертифікати
 * тепер теж реальні — `getCertificatesForUserAction` (`modules/certificates`,
 * новий модуль, Фаза "Fixes", 02.08.2026) в обох гілках.
 */
export default function UserCertificatesPage({ params }: UserCertificatesPageProps) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const isOwnProfile = status === "authenticated" && session?.user?.id === id;
  /**
   * CERT+.2.6 (08.08.2026, постмодерація). Той самий принцип, що вже
   * обчислює `isOwnProfile` вище — реальна сесія, не хардкод. Дозволяє
   * адміну видаляти образливий/нерелевантний завантажений сертифікат на
   * ЧУЖОМУ профілі (кнопка "Завантажити" лишається лише для власника).
   */
  const isAdmin =
    status === "authenticated" &&
    (session?.user as { role?: string } | undefined)?.role === "ADMIN";

  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    getPublicProfileAction(id).then((result) => {
      if (cancelled) return;
      setProfile(result.success ? result.profile : null);
    });
    getCertificatesForUserAction(id).then((result) => {
      if (!cancelled && result.success) {
        setCertificates(result.certificates);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (profile === undefined) {
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 py-8 pb-16 sm:py-10">
          <div className="mx-auto max-w-5xl px-6" />
        </main>
      </div>
    );
  }

  if (profile === null) {
    notFound();
  }

  if (isOwnProfile) {
    return (
      <AccountLayout user={{ name: profile.name, avatarUrl: profile.avatarUrl }}>
        <nav aria-label="Хлібні крихти" className="flex items-center gap-1.5 text-sm">
          <Link href="/" className="text-muted hover:text-accent-dark">
            Головна
          </Link>
          <span className="text-rose-line">/</span>
          <span className="text-muted">Сертифікати</span>
        </nav>

        <div className="mt-4">
          <CertificatesPageContent
            certificates={certificates}
            holderName={profile.name}
            heading="Мої сертифікати"
            subtitle="Тут зберігаються сертифікати, які ви отримали після успішного проходження курсів."
            emptyText="Ще немає жодного отриманого сертифіката. Заверши курс, щоб отримати перший."
            bannerText="Сертифікат — це підтвердження ваших знань та навичок. Продовжуйте навчання та відкривайте нові можливості!"
            isOwner
            onUploaded={(certificate) => setCertificates((prev) => [certificate, ...prev])}
            onDeleted={(certId) => setCertificates((prev) => prev.filter((c) => c.id !== certId))}
          />
        </div>
      </AccountLayout>
    );
  }

  const firstName = profile.name.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 py-8 pb-16 sm:py-10">
        <div className="mx-auto max-w-5xl px-6">
          <nav aria-label="Хлібні крихти" className="flex items-center gap-1.5 text-sm">
            <Link href="/" className="text-muted hover:text-accent-dark">
              Головна
            </Link>
            <span className="text-rose-line">/</span>
            <Link href={`/users/${id}`} className="text-muted hover:text-accent-dark">
              {profile.name}
            </Link>
            <span className="text-rose-line">/</span>
            <span className="text-muted">Сертифікати</span>
          </nav>

          <div className="mt-4">
            <CertificatesPageContent
              certificates={certificates}
              holderName={profile.name}
              heading={`Сертифікати — ${profile.name}`}
              subtitle={`Сертифікати, які ${firstName} отримала після успішного проходження курсів.`}
              emptyText={`${firstName} ще не отримала жодного сертифіката.`}
              bannerText="Сертифікат — це підтвердження знань і навичок, отриманих на курсах NATALIEVA."
              isAdmin={isAdmin}
              onDeleted={(certId) => setCertificates((prev) => prev.filter((c) => c.id !== certId))}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
