"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { GuestGate } from "@/components/account/GuestGate";
import { CertificatesPageContent } from "@/components/certificates/CertificatesPageContent";
import { getPublicProfileAction } from "@/modules/profile/actions";
import { getCertificatesForUserAction } from "@/modules/certificates";
import type { PublicProfile } from "@/modules/profile/service";
import type { CertificateEntry } from "@/modules/certificates";
export const dynamic = 'force-dynamic'
/**
 * Сторінка "Мої сертифікати" (`/certificates`, задача 0.14), за мокапом
 * `MyCertificates.png`.
 *
 * 0.14.1 — хлібна крихта "Головна / Сертифікати" над заголовком. На відміну
 * від інших сторінок кабінету (`/profile`, `/settings`, `/homework`), які
 * її не мають, тут вона є в мокапі явно — додана лише тут, локально для
 * сторінки (не винесена в спільний layout, щоб не міняти інші сторінки
 * кабінету без потреби).
 *
 * 0.14.2–0.14.5 — заголовок, картка-лічильник, сітка карток, нижній банер:
 * усе це спільний `CertificatesPageContent` (задача 0.16, сесія 15) —
 * винесено, щоб той самий вигляд показати і на публічній
 * `/users/[id]/certificates`. Кнопки "Завантажити"/"Поділитись" на картках
 * — без обробників (немає PDF/Web Share API за мокапом).
 *
 * 02.08.2026, Фаза "Fixes", за прямим проханням користувача: реальна
 * видача сертифікатів (`modules/certificates`, автоматично при завершенні
 * курсу — `submitQuizResultAction`). Ім'я/аватар — реальна сесія (той
 * самий фікс, що на `/profile`), сертифікати — `getCertificatesForUserAction`
 * замість `DEMO_CERTIFICATES`.
 */
export default function CertificatesPage() {
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const userId = session?.user?.id;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    getPublicProfileAction(userId).then((result) => {
      if (!cancelled && result.success) setProfile(result.profile);
    });
    getCertificatesForUserAction(userId).then((result) => {
      if (!cancelled && result.success) setCertificates(result.certificates);
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName = session?.user?.name ?? profile?.name ?? "";
  const avatarUrl =
    (session?.user as { avatarUrl?: string } | undefined)?.avatarUrl ??
    profile?.avatarUrl ??
    null;

  if (status === "loading") {
    return null;
  }

  if (!loggedIn) {
    return <GuestGate description="сертифікатів" />;
  }

  return (
    <AccountLayout user={{ name: displayName, avatarUrl }}>
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
          holderName={displayName}
          heading="Мої сертифікати"
          subtitle="Тут зберігаються сертифікати, які ви отримали після успішного проходження курсів."
          emptyText="Ще немає жодного отриманого сертифіката. Заверши курс, щоб отримати перший."
          bannerText="Сертифікат — це підтвердження ваших знань та навичок. Продовжуйте навчання та відкривайте нові можливості!"
          isOwner
          onUploaded={(certificate) => setCertificates((prev) => [certificate, ...prev])}
          onDeleted={(id) => setCertificates((prev) => prev.filter((c) => c.id !== id))}
        />
      </div>
    </AccountLayout>
  );
}
