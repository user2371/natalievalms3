"use client";

import { useState } from "react";
import { DiplomaIcon, CloseIcon, FullscreenIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/Modal";
import { CertificateVisual } from "@/components/certificates/CertificateCard";
import type { CertificateEntry as Certificate } from "@/modules/certificates";

export interface CertificateThumbnailProps {
  certificate: Certificate;
  /**
   * CERT+.2.8 (09.08.2026): раніше вела на повний список сертифікатів
   * (`/certificates` або `/users/[id]/certificates`) — тепер клік по
   * мініатюрі відкриває лайтбокс (як на `CertificateCard`), а не
   * переходить на сторінку. Проп лишено НЕОБОВ'ЯЗКОВИМ і невикористаним
   * тут навмисно — виклики (`app/profile/page.tsx`, `app/users/[id]/
   * page.tsx`) досі мають окрему кнопку "Показати всі" з тим самим
   * посиланням поруч, тож прибирати проп із сигнатури й правити обидва
   * виклики заради самого лише видалення невикористаного значення —
   * зайвий churn.
   */
  href?: string;
  /**
   * Ім'я власника — потрібне лише для лайтбоксу `SYSTEM`-сертифіката
   * (`CertificateVisual` малює "Підтверджує, що {ім'я}..."), у самій
   * плитці не показується (замало місця, CERT+.2.4).
   */
  holderName: string;
}

/**
 * Мала мініатюра сертифіката для секції "Сертифікати" на `/profile` і
 * `/users/[id]` (задача 0.16) — замінює колишню секцію "Досягнення"
 * (`AchievementBadge`). Зменшена версія "паперового" сертифіката
 * (`CertificateCard`/`CertificateVisual`, `/certificates`): вордмарк,
 * медальйон-печатка, назва курсу — без імені й дати, щоб влізти в маленьку
 * плитку.
 *
 * CERT+.2.4 (08.08.2026): для `source === "uploaded"` — маленьке РЕАЛЬНЕ
 * ФОТО (`object-cover`, тут обрізка прийнятна — це лише мініатюра-плитка,
 * не повноцінна картка, на відміну від `CertificateCard`/CERT+.2.3) замість
 * намальованого SVG-вордмарку.
 *
 * CERT+.2.8 (09.08.2026, прохання користувача): клік по мініатюрі більше
 * НЕ веде на сторінку списку сертифікатів (це вже робить окрема кнопка
 * "Показати всі" поруч із секцією) — відкриває лайтбокс із великою версією
 * САМЕ ЦЬОГО сертифіката, той самий патерн, що вже на `CertificateCard`
 * (`Modal` variant="media").
 */
export function CertificateThumbnail({ certificate, holderName }: CertificateThumbnailProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isUploaded = certificate.source === "uploaded";

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group flex flex-col items-center gap-2 text-center"
        aria-label={`Переглянути сертифікат «${certificate.courseName}» у великому розмірі`}
      >
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border border-rose-line/50 bg-white p-1.5 shadow-sm transition-shadow group-hover:shadow-md">
          {isUploaded && certificate.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={certificate.imageUrl}
              alt={certificate.courseName}
              className="h-full w-full rounded-[5px] object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 rounded-[5px] border border-rose-line/40 px-1 py-1">
              <p className="font-serif text-[5.5px] tracking-[0.2em] text-accent-dark sm:text-[6px]">
                NATALIEVA
              </p>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark sm:h-6 sm:w-6">
                <DiplomaIcon size={11} className="text-white/90" />
              </span>
              <p className="line-clamp-2 px-1 text-[6.5px] leading-tight font-semibold text-ink uppercase sm:text-[7.5px]">
                {certificate.courseName}
              </p>
            </div>
          )}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/15 group-hover:opacity-100">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm">
              <FullscreenIcon size={13} />
            </span>
          </span>
        </div>
        <p className="line-clamp-1 max-w-full text-xs font-medium text-ink group-hover:text-accent-dark">
          {certificate.courseName}
        </p>
      </button>

      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        labelledBy="certificate-thumbnail-lightbox-title"
        variant="media"
      >
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2
            id="certificate-thumbnail-lightbox-title"
            className="truncate font-serif text-sm text-ink sm:text-base"
          >
            {certificate.courseName}
          </h2>
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Закрити"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-soft/40 hover:text-ink"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        {isUploaded && certificate.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={certificate.imageUrl}
            alt={certificate.courseName}
            className="max-h-[75vh] w-full rounded-xl object-contain"
          />
        ) : (
          <CertificateVisual courseName={certificate.courseName} holderName={holderName} />
        )}
      </Modal>
    </>
  );
}
