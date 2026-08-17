"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CheckIcon, ChevronDownIcon, DocumentIcon } from "@/components/ui/icons";
import { DEFAULT_ARTICLE_TAKEAWAYS, DEFAULT_ARTICLE_TEXT } from "@/lib/data/lessons";

export interface LessonArticleBlockProps {
  text?: string;
  takeaways?: string[];
  /**
   * Ілюстративне зображення поруч зі статтею (задача 0.7.13). Якщо не
   * передано — блок з ілюстрацією не рендериться.
   */
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
}

/**
 * Блок "Про сьогоднішній урок" (задача 0.7.12): заголовок + бейдж
 * "Стаття про урок", collapsible-текст статті, чек-лист "Ти дізнаєшся:".
 * Реальний контент статті (Tiptap) на урок — Фаза 3; зараз простий текст-
 * заглушка з `lib/data/lessons.ts`. Ілюстрація рендериться поруч з текстом
 * статті на широких екранах і над текстом на мобільних (задача 0.7.13).
 */
export function LessonArticleBlock({
  text = DEFAULT_ARTICLE_TEXT,
  takeaways = DEFAULT_ARTICLE_TAKEAWAYS,
  imageUrl,
  imageAlt = "Ілюстрація до уроку",
  className,
}: LessonArticleBlockProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card padding="lg" className={className}>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-3">
          <h2 className="font-serif text-xl text-ink">Про сьогоднішній урок</h2>
          <Badge variant="soft" icon={<DocumentIcon size={13} />}>
            Стаття про урок
          </Badge>
        </span>

        <ChevronDownIcon
          size={18}
          className={`shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4">
          <div
            className={
              imageUrl
                ? "grid grid-cols-1 gap-5 sm:grid-cols-[minmax(0,1fr)_200px] sm:items-start"
                : undefined
            }
          >
            <p className="text-sm leading-relaxed text-ink/85">{text}</p>

            {imageUrl && (
              <div className="relative order-first aspect-video overflow-hidden rounded-xl bg-ink sm:order-last sm:aspect-square">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>

          <div className="mt-5 rounded-xl bg-cream-soft/60 p-4">
            <h3 className="text-sm font-medium text-ink">Ти дізнаєшся:</h3>
            <ul className="mt-2.5 flex flex-col gap-2">
              {takeaways.map((item, index) => (
                <li key={index} className="flex items-start gap-2.5 text-sm text-ink/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft/60 text-accent-dark">
                    <CheckIcon size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
