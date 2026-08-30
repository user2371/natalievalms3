"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  DiplomaIcon,
  DownloadIcon,
  ShareIcon,
  HeartIcon,
  TrashIcon,
  CloseIcon,
  FullscreenIcon,
} from "@/components/ui/icons";
import { deleteCertificateAction } from "@/modules/certificates";
import type { CertificateEntry as Certificate } from "@/modules/certificates";

const DATE_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export interface CertificateCardProps {
  certificate: Certificate;
  holderName: string;
  /**
   * CERT+.2.3/CERT+.2.6 (08.08.2026). Показує кнопку "Видалити" —
   * `true`, коли поточна людина може видалити САМЕ ЦЕЙ сертифікат:
   * власник (свій завантажений) або адмін (будь-чий завантажений).
   * Свідомо НЕ прив'язано напряму до `isOwner`/`isAdmin` тут — рішення,
   * хто саме може видаляти, приймає батьківський
   * `CertificatesPageContent` (де обидва прапорці вже є), картка лише
   * показує/ховає кнопку за готовим булевим значенням. Кнопка й так
   * ніколи не рендериться для `source === "system"` (сервіс однаково
   * відхилить спробу, CERT+.1.3, але марний клік краще не провокувати).
   */
  canDelete?: boolean;
  /** Текст підтвердження в модалці — різний для власного й адмінського видалення (CERT+.2.6). */
  deleteConfirmText?: string;
  /** Викликається після успішного видалення — батьківська сторінка прибирає картку зі свого стейту. */
  onDeleted?: (certificateId: string) => void;
}

/**
 * Картка сертифіката на `/certificates` (задача 0.14): "паперовий" вигляд
 * сертифіката (`CertificateVisual`) + мета-інформація (назва курсу, бейдж
 * "Отримано"/"Завантажено", дата видачі) і кнопки "Завантажити"/"Поділитись"
 * — без реальної логіки (немає PDF-генерації чи Web Share API за мокапом).
 *
 * CERT+.2.3 (08.08.2026): для `source === "uploaded"` замість намальованого
 * SVG-"паперу" рендериться РЕАЛЬНЕ ФОТО (`certificate.imageUrl`),
 * `object-contain` — на відміну від аватарки, обрізати кути реального
 * документа небажано. Бейдж "Отримано" (SYSTEM) замінюється на
 * "Завантажено" (UPLOADED). Кнопка "Видалити" — лише коли `canDelete` і
 * `source === "uploaded"`.
 *
 * CERT+.2.7 (09.08.2026): сам сертифікат (фото для `uploaded` або
 * намальований `CertificateVisual` для `system`) — клікабельний, відкриває
 * лайтбокс (`Modal` variant="media") з великою версією. Для `uploaded`
 * рендериться те саме `certificate.imageUrl` без обрізки (`object-contain`,
 * як і в самій картці), просто в більшому контейнері — окремого
 * "оригінального" URL немає. Для `system` — той самий SVG-"папір", просто
 * у більшій картці.
 *
 * ФАЗА CERTTPL+.0.4 (30.08.2026) — умова рендеру фото ЗМІНЕНА з
 * `isUploaded && certificate.imageUrl` на просто `certificate.imageUrl`
 * (в обох місцях: картка й лайтбокс нижче). Причина: `certificate.
 * imageUrl` для `source === "system"` тепер теж може бути заповнений
 * (`modules/certificates/repository.ts::findAllForUser` — власний
 * макет сертифіката курсу, завантажений адміном у `CourseForm.tsx`,
 * якщо такий є). Бейдж "Отримано"/"Завантажено" й кнопки нижче й далі
 * залежать саме від `isUploaded` (`source`), не від `imageUrl` — це два
 * незалежні питання: "яке зображення показати" (за `imageUrl`) і "чий
 * це сертифікат і що з ним можна робити" (за `source`).
 */
export function CertificateCard({
  certificate,
  holderName,
  canDelete = false,
  deleteConfirmText = "Цю дію неможливо скасувати.",
  onDeleted,
}: CertificateCardProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isUploaded = certificate.source === "uploaded";

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteCertificateAction(certificate.id);
      if (result.success) {
        setDeleteModalOpen(false);
        onDeleted?.(certificate.id);
      } else {
        setError(result.error ?? "Не вдалося видалити сертифікат");
      }
    } catch {
      setError("Не вдалося видалити сертифікат. Спробуйте ще раз.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-rose-line/40 bg-white p-4 sm:p-5">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="group relative block w-full cursor-zoom-in rounded-xl text-left"
        aria-label={`Переглянути сертифікат «${certificate.courseName}» у великому розмірі`}
      >
        {certificate.imageUrl ? (
          <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-rose-line/50 bg-rose-soft/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={certificate.imageUrl}
              alt={certificate.courseName}
              className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <CertificateVisual courseName={certificate.courseName} holderName={holderName} />
        )}
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-ink/0 opacity-0 transition-all duration-200 group-hover:bg-ink/15 group-hover:opacity-100">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm">
            <FullscreenIcon size={16} />
          </span>
        </span>
      </button>

      <div className="mt-4 flex items-start justify-between gap-3">
        <p className="font-serif text-base text-ink sm:text-lg">
          {certificate.courseName}
        </p>
        <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-dark">
          {isUploaded ? "Завантажено" : "Отримано"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">
        Видано: {DATE_FORMATTER.format(new Date(certificate.issuedAt))}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {!isUploaded && (
          <>
            <Button
              variant="outline"
              size="sm"
              icon={<DownloadIcon size={16} />}
              iconPosition="left"
            >
              Завантажити
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<ShareIcon size={16} />}
              iconPosition="left"
            >
              Поділитись
            </Button>
          </>
        )}
        {isUploaded && canDelete && (
          <Button
            variant="outline"
            size="sm"
            icon={<TrashIcon size={16} />}
            iconPosition="left"
            onClick={() => setDeleteModalOpen(true)}
          >
            Видалити
          </Button>
        )}
      </div>

      {isUploaded && canDelete && (
        <Modal
          open={deleteModalOpen}
          onClose={() => !deleting && setDeleteModalOpen(false)}
          labelledBy="delete-certificate-title"
        >
          <h2 id="delete-certificate-title" className="font-serif text-xl text-ink">
            Видалити сертифікат?
          </h2>
          <p className="mt-2 text-sm text-muted">{deleteConfirmText}</p>
          {error && <p className="mt-2 text-sm text-danger">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Скасувати
            </Button>
            <Button
              variant="dangerSolid"
              size="sm"
              icon={<TrashIcon size={16} />}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Видаляємо…" : "Так, видалити"}
            </Button>
          </div>
        </Modal>
      )}

      <Modal
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        labelledBy="certificate-lightbox-title"
        variant="media"
      >
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2
            id="certificate-lightbox-title"
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
        {certificate.imageUrl ? (
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
    </div>
  );
}

/**
 * Стилізований "паперовий" сертифікат — за мокапом `MyCertificates.png`:
 * подвійна рамка, вордмарк NATALIEVA, заголовок "СЕРТИФІКАТ", ім'я
 * власника курсивом, назва курсу, восковий медальйон-печатка справа й
 * підпис "Natalieva" з сердечком знизу зліва. Декоративні мазки в кутах —
 * той самий мотив, що й у `DecorativeBackground`/`SidebarDecoration`.
 *
 * CERT+.2.8 (09.08.2026): експортовано — використовується не лише тут, а
 * й у лайтбоксі `CertificateThumbnail` (мініатюри на `/profile`/
 * `/users/[id]`), щоб не дублювати той самий SVG-"папір" вдруге.
 */
export function CertificateVisual({
  courseName,
  holderName,
}: {
  courseName: string;
  holderName: string;
}) {
  return (
    <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-rose-line/50 bg-white p-4 sm:p-5">
      <svg
        aria-hidden
        className="absolute -top-6 -left-6 h-24 w-24 text-rose-line/30"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M10 150 Q60 80 120 110 T190 40"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
        />
      </svg>
      <svg
        aria-hidden
        className="absolute -right-8 -bottom-8 h-28 w-28 text-rose-line/30"
        viewBox="0 0 200 200"
        fill="none"
      >
        <path
          d="M10 40 Q70 120 130 70 T190 150"
          stroke="currentColor"
          strokeWidth="20"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative flex h-full flex-col items-center justify-center rounded-lg border border-rose-line/40 px-4 py-3 text-center sm:px-6">
        <p className="font-serif text-[10px] tracking-[0.35em] text-accent-dark sm:text-xs">
          NATALIEVA
        </p>
        <p className="mt-2 font-serif text-xl tracking-[0.2em] text-ink sm:text-2xl">
          СЕРТИФІКАТ
        </p>
        <p className="mt-1.5 text-[9px] tracking-[0.2em] text-muted uppercase sm:text-[10px]">
          Підтверджує, що
        </p>
        <p className="mt-2 font-serif text-lg text-accent-dark italic sm:text-xl">
          {holderName}
        </p>
        <p className="mt-1.5 text-[10px] text-muted sm:text-xs">успішно завершила курс</p>
        <p className="mt-1 max-w-[78%] font-serif text-sm font-semibold tracking-wide text-ink uppercase sm:text-base">
          {courseName}
        </p>

        <p className="absolute bottom-3 left-4 font-serif text-xs text-accent-dark italic sm:bottom-4 sm:left-6">
          Natalieva <HeartIcon size={10} className="inline text-accent" />
        </p>

        <CertificateSeal />
      </div>
    </div>
  );
}

/** Восковий медальйон-печатка зі стрічкою — права частина сертифіката. */
function CertificateSeal() {
  return (
    <div className="absolute top-1/2 right-4 -translate-y-1/4 sm:right-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-dark shadow-sm sm:h-14 sm:w-14">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 sm:h-10 sm:w-10">
          <DiplomaIcon size={16} className="text-white/90" />
        </div>
      </div>
      <div className="mx-auto -mt-1 flex w-12 justify-center gap-2.5 sm:w-14">
        <span
          className="h-4 w-2.5 bg-accent-dark/80"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }}
        />
        <span
          className="h-4 w-2.5 bg-accent-dark/80"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)" }}
        />
      </div>
    </div>
  );
}
