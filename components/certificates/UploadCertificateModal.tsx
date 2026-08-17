"use client";

import { useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { UploadIcon, DiplomaIcon } from "@/components/ui/icons";
import { uploadCertificateAction } from "@/modules/certificates";
import type { CertificateEntry } from "@/modules/certificates";

export interface UploadCertificateModalProps {
  /** Викликається з готовим `CertificateEntry` одразу після успішного завантаження — сторінка (`app/certificates/page.tsx`) додає його в локальний список без повторного запиту всього списку заново. */
  onUploaded: (certificate: CertificateEntry) => void;
}

/**
 * `UploadCertificateModal` — F.22 (08.08.2026, за прямим проханням
 * користувача: "зроби щоб юзер міг загружати свої сертифікати — типу
 * якщо в нього є паперовий сертифікат то щоб він міг його сфотографувати
 * і завантажити jpeg").
 *
 * Кнопка "Завантажити сертифікат" + модалка (`Modal`, той самий
 * компонент, що вже в модалках `/settings` — зміна email/видалення
 * акаунта) з полем назви й вибором файлу. Той самий патерн, що вже в
 * `app/settings/page.tsx` для аватарки: `<input type="file">` під
 * стилізованим `<label>`, локальний прев'ю через `URL.createObjectURL`,
 * `FormData` → `uploadCertificateAction` (`modules/certificates/
 * actions.ts`, реальна серверна валідація типу/розміру — клієнтський
 * `accept=` тут лише зручність, не захист).
 *
 * Показується лише власнику сторінки (`CertificatesPageContent`,
 * `isOwner` пропс) — завантажити сертифікат до ЧУЖОГО профілю не можна
 * (та й `uploadCertificateAction` все одно прив'язує запис до
 * `session.user.id`, а не до довільного `userId` з пропсів, тому навіть
 * якби кнопку показали на чужій сторінці, сертифікат зберігся б у
 * ВЛАСНИЙ профіль виконавця дії, не в чужий).
 */
export function UploadCertificateModal({ onUploaded }: UploadCertificateModalProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setTitle("");
    setFile(null);
    setPreview(null);
    setError(null);
  }

  function handleClose() {
    if (uploading) return;
    setOpen(false);
    reset();
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleSubmit() {
    if (!file) {
      setError("Оберіть фото сертифіката");
      return;
    }
    if (title.trim().length < 2) {
      setError("Назва має містити щонайменше 2 символи");
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("title", title);
    formData.append("image", file);
    const result = await uploadCertificateAction(formData);

    setUploading(false);

    if (result.success && result.certificate) {
      onUploaded(result.certificate);
      setOpen(false);
      reset();
    } else {
      setError(result.error ?? "Не вдалося завантажити сертифікат");
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        icon={<UploadIcon size={16} />}
        iconPosition="left"
        onClick={() => setOpen(true)}
      >
        Завантажити сертифікат
      </Button>

      <Modal open={open} onClose={handleClose} labelledBy="upload-certificate-title">
        <h2
          id="upload-certificate-title"
          className="flex items-center gap-2 font-serif text-xl text-ink"
        >
          <DiplomaIcon size={20} className="text-accent-dark" />
          Завантажити сертифікат
        </h2>
        <p className="mt-2 text-sm text-muted">
          Є паперовий сертифікат? Сфотографуй його і завантаж — він з&apos;явиться
          серед твоїх сертифікатів разом з отриманими на платформі.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Input
            placeholder="Назва (наприклад: «Базовий манікюр, салон „Ромашка”»)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            aria-label="Назва сертифіката"
          />

          {preview ? (
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl border border-rose-line/50 bg-cream-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-full w-full object-contain" />
            </div>
          ) : (
            <label
              className="flex aspect-[3/2] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-rose-line/60 text-center text-sm text-muted transition-colors hover:border-accent hover:text-accent-dark"
            >
              <UploadIcon size={22} />
              Натисни, щоб обрати фото
              <span className="text-xs">JPG або PNG, максимум 5MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>
          )}

          {preview && (
            <label className="cursor-pointer self-start text-xs text-accent-dark underline underline-offset-2">
              Обрати інше фото
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={uploading}>
            Скасувати
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={uploading || !file}>
            {uploading ? "Завантаження…" : "Завантажити"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
