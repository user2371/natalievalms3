"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

export interface ReportMessageModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  submitting?: boolean;
}

/**
 * `components/messages/ReportMessageModal.tsx` — ФАЗА MSG+, задача
 * MSG+.4.1 (04.09.2026). Кнопка "поскаржитись" на чужому повідомленні
 * (`app/messages/[conversationId]/page.tsx`) відкриває цю модалку —
 * той самий структурний патерн, що `AdminConfirmDeleteModal`
 * (`Modal` + заголовок + текст + кнопки), лише з полем причини замість
 * простого підтвердження.
 */
export function ReportMessageModal({ open, onClose, onSubmit, submitting = false }: ReportMessageModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (submitting) return;
    setReason("");
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Вкажіть причину скарги");
      return;
    }
    setError(null);
    await onSubmit(trimmed);
    setReason("");
  }

  return (
    <Modal open={open} onClose={handleClose} labelledBy="report-message-title">
      <h2 id="report-message-title" className="font-serif text-xl text-ink">
        Поскаржитись на повідомлення
      </h2>
      <p className="mt-2 text-sm text-muted">
        Опишіть, чому це повідомлення порушує правила платформи. Скаргу розгляне адміністратор.
      </p>
      <Textarea
        className="mt-4"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Причина скарги…"
        rows={4}
        maxLength={500}
        error={error ?? undefined}
        aria-label="Причина скарги"
        autoFocus
      />
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={handleClose} disabled={submitting}>
          Скасувати
        </Button>
        <Button variant="dangerSolid" size="sm" onClick={handleSubmit} disabled={submitting} loading={submitting}>
          Надіслати скаргу
        </Button>
      </div>
    </Modal>
  );
}
