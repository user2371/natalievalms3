"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";

export interface CommentFormProps {
  onSubmit: (text: string) => void;
  className?: string;
}

/**
 * Форма додавання коментаря (задача 0.7.21): textarea + кнопка "Надіслати".
 * Показується лише залогіненому користувачу — для гостя її місце займає
 * `GuestCommentBanner` (задача 0.7.22).
 */
export function CommentForm({ onSubmit, className }: CommentFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) {
      setError("Напиши щось перед надсиланням");
      return;
    }

    onSubmit(trimmed);
    setText("");
    setError(null);
  }

  return (
    <div className={className}>
      <Textarea
        placeholder="Поділіться своїм досвідом або поставте питання…"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        error={error ?? undefined}
        aria-label="Текст коментаря"
        rows={3}
      />
      <div className="mt-2.5 flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          icon={<ArrowRightIcon size={15} />}
          onClick={handleSubmit}
        >
          Надіслати
        </Button>
      </div>
    </div>
  );
}
