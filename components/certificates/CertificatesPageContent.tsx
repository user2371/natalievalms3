"use client";

import { useState, type ChangeEvent } from "react";
import { CertificateCard } from "@/components/certificates/CertificateCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { DiplomaIcon, ShieldIcon, UploadIcon } from "@/components/ui/icons";
import { uploadCertificateAction } from "@/modules/certificates";
import type { CertificateEntry as Certificate } from "@/modules/certificates";
import { cn } from "@/lib/utils";

export interface CertificatesPageContentProps {
  certificates: Certificate[];
  holderName: string;
  heading: string;
  subtitle: string;
  emptyText: string;
  bannerText: string;
  /**
   * CERT+.2.1 (08.08.2026). `true` лише на `/certificates` (власна
   * сторінка), `false` на `/users/[id]/certificates` (перегляд чужого
   * профілю — там лише перегляд, як і для системних сертифікатів).
   */
  isOwner?: boolean;
  /**
   * CERT+.2.6 (08.08.2026, постмодерація). `true`, коли поточна людина —
   * адмін і переглядає ЧУЖИЙ профіль (`isOwner` і `isAdmin` НАВМИСНО не
   * поєднані в один прапорець — кнопка "Завантажити" лишається ЛИШЕ для
   * власника, CERT+.2.1, а видаляти можуть і власник, і адмін).
   * Обчислюється сторінкою (`app/users/[id]/certificates/page.tsx`), той
   * самий принцип, що вже `isOwnProfile` на цій сторінці.
   */
  isAdmin?: boolean;
  /**
   * CERT+.2.2 — викликається після успішного завантаження нового
   * сертифіката, щоб сторінка-власник (`app/certificates/page.tsx`,
   * `app/users/[id]/certificates/page.tsx`) додала його у свій локальний
   * стан БЕЗ повторного `getCertificatesForUserAction` (той самий
   * принцип, що вже в `handleAvatarFileChange`/`updateSession` на
   * `/settings` — оновлюємо те, що вже маємо на клієнті, а не
   * перезапитуємо все наново).
   */
  onUploaded?: (certificate: Certificate) => void;
  /**
   * CERT+.2.3/CERT+.2.6 — викликається після успішного видалення
   * завантаженого сертифіката (власником або адміном), щоб сторінка
   * прибрала картку зі свого локального стейту без повторного запиту
   * всього списку (той самий принцип, що `onUploaded` вище).
   */
  onDeleted?: (certificateId: string) => void;
}

/**
 * Спільний вміст сторінки сертифікатів (задача 0.16) — заголовок, картка-
 * лічильник, сітка `CertificateCard` (або порожній стан) і нижній банер.
 * Винесено з `/certificates` (0.14), щоб той самий вигляд перевикористати
 * на публічній `/users/[id]/certificates` — сертифікати будь-якого
 * користувача може переглянути будь-хто, не тільки власник профілю.
 * Заголовок/підпис/тексти — пропси, бо відрізняються для "своєї" та
 * "чужої" сторінки (звертання на "ви" не годиться для чужого профілю).
 *
 * CERT+.2.1/CERT+.2.2 (08.08.2026): кнопка "Завантажити сертифікат" +
 * модалка завантаження — `"use client"` тепер обов'язковий (раніше
 * компонент був чисто презентаційним, без стану); і `/certificates`, і
 * `/users/[id]/certificates` вже й так `"use client"`-сторінки, тож це
 * нічого не ламає.
 */
export function CertificatesPageContent({
  certificates,
  holderName,
  heading,
  subtitle,
  emptyText,
  bannerText,
  isOwner = false,
  isAdmin = false,
  onUploaded,
  onDeleted,
}: CertificatesPageContentProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeUploadModal() {
    setUploadModalOpen(false);
    setTitle("");
    setFile(null);
    setPreview(null);
    setError(null);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = ""; // дозволяє повторно вибрати той самий файл наступного разу
    if (!selected) return;
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleUpload() {
    if (!title || !file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("image", file);
      const result = await uploadCertificateAction(formData);

      if (result.success && result.certificate) {
        onUploaded?.(result.certificate);
        closeUploadModal();
      } else {
        setError(result.error ?? "Не вдалося завантажити сертифікат");
      }
    } catch {
      // Той самий запобіжник, що в `handleAvatarFileChange` (IMG+.2.6,
      // `/settings`) — на випадок мережевого/фреймворкового збою, коли
      // `uploadCertificateAction` не встигає повернути `{success, error}`.
      setError("Не вдалося завантажити файл. Спробуйте ще раз.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-dark">
            <DiplomaIcon size={22} />
          </span>
          <div>
            <h1 className="font-serif text-3xl text-ink sm:text-4xl">{heading}</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">{subtitle}</p>
          </div>
        </div>

        {isOwner && (
          <Button size="sm" icon={<UploadIcon size={16} />} onClick={() => setUploadModalOpen(true)}>
            Завантажити сертифікат
          </Button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-rose-line/40 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
          <DiplomaIcon size={18} />
        </span>
        <div>
          <p className="text-sm text-muted">Всього сертифікатів</p>
          <p className="font-serif text-2xl text-ink">{certificates.length}</p>
        </div>
      </div>

      {certificates.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              holderName={holderName}
              canDelete={isOwner || isAdmin}
              deleteConfirmText={
                isOwner
                  ? "Цю дію неможливо скасувати."
                  : "Видалити цей сертифікат як адміністратор? Дію не можна скасувати."
              }
              onDeleted={onDeleted}
            />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-rose-line/60 py-10 text-center text-sm text-muted">
          {emptyText}
        </p>
      )}

      <div className="mt-8 flex items-center gap-4 rounded-2xl bg-accent-soft/40 px-5 py-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-accent-dark">
          <ShieldIcon size={18} />
        </span>
        <p className="text-sm text-ink/80">{bannerText}</p>
      </div>

      {isOwner && (
        <Modal open={uploadModalOpen} onClose={closeUploadModal} labelledBy="upload-certificate-title">
          <h2 id="upload-certificate-title" className="font-serif text-xl text-ink">
            Завантажити сертифікат
          </h2>
          <p className="mt-2 text-sm text-muted">
            Додайте фото чи скан сертифіката, отриманого поза NATALIEVA.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            <Input
              placeholder="Назва сертифіката"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Назва сертифіката"
              disabled={uploading}
            />

            <label
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-rose-line/60 px-4 py-3 text-sm text-ink transition-colors hover:border-accent",
                uploading && "pointer-events-none opacity-50",
              )}
            >
              <UploadIcon size={18} />
              {file ? file.name : "Обрати файл"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>

            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="max-h-48 w-full rounded-xl border border-rose-line/40 object-contain"
              />
            )}

            <p className="text-xs text-muted">JPG, PNG або WebP, до 10MB.</p>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={closeUploadModal}>
              Скасувати
            </Button>
            <Button size="sm" onClick={handleUpload} disabled={uploading || !title || !file}>
              {uploading ? "Завантажуємо…" : "Зберегти"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
