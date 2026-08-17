import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface AdminConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Напр. `курс "Манікюр з нуля"`, `урок "Дизайн нігтів"`, `коментар` — підставляється в текст питання. */
  entityLabel: string;
  /**
   * Задача 8.1.5/8.2.5 — додаткове попередження про каскадне видалення
   * (напр. "Усі уроки, прогрес учнів і коментарі цього курсу будуть
   * видалені назавжди"). Опційне — без нього модалка виглядає так само,
   * як і раніше (для сутностей без каскаду, напр. коментар).
   */
  warning?: string;
  /** `true` під час виконання запиту видалення. */
  submitting?: boolean;
}

/**
 * Універсальна модалка підтвердження видалення (задача 0.13.11), за
 * мокапом `adminPanel.png` — використовується для курсу/уроку/питання/
 * коментаря, різниця лише в `entityLabel` (і опційному `warning`).
 */
export function AdminConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  entityLabel,
  warning,
  submitting = false,
}: AdminConfirmDeleteModalProps) {
  return (
    <Modal open={open} onClose={onClose} labelledBy="admin-delete-title">
      <h2 id="admin-delete-title" className="font-serif text-xl text-ink">
        Підтвердження видалення
      </h2>
      <p className="mt-2 text-sm text-muted">
        Ви дійсно хочете видалити {entityLabel}? Цю дію неможливо скасувати.
      </p>
      {warning && (
        <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {warning}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
          Скасувати
        </Button>
        <Button
          variant="dangerSolid"
          size="sm"
          onClick={onConfirm}
          disabled={submitting}
          loading={submitting}
        >
          Видалити
        </Button>
      </div>
    </Modal>
  );
}
