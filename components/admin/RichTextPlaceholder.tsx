"use client";

const TOOLBAR_BUTTONS = [
  { label: "B", className: "font-bold" },
  { label: "I", className: "italic" },
  { label: "U", className: "underline" },
  { label: "•", className: "" },
  { label: "1.", className: "" },
  { label: "🔗", className: "" },
  { label: "↺", className: "" },
  { label: "↻", className: "" },
];

export interface RichTextPlaceholderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

/**
 * Заготовка редактора статті (задача 0.13.6, використовується і для поля
 * "Про курс" в 0.13.3): рядок кнопок тулбару, за мокапом `adminPanel.png`
 * (B/I/підкреслення/списки/посилання/undo/redo) — суто декоративний, кнопки
 * без обробників (реальна інтеграція Tiptap — задача 8.3.1+), плюс звичайна
 * `<textarea>` знизу для введення тексту (щоб форму можна було реально
 * заповнити вже зараз, без чекання на бекенд).
 */
export function RichTextPlaceholder({
  value,
  onChange,
  placeholder,
  rows = 5,
}: RichTextPlaceholderProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-rose-line/60 bg-white focus-within:border-accent">
      <div className="flex flex-wrap items-center gap-1 border-b border-rose-line/40 bg-cream-soft/50 px-2 py-1.5">
        {TOOLBAR_BUTTONS.map((btn) => (
          <span
            key={btn.label}
            aria-hidden
            className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm text-muted ${btn.className}`}
          >
            {btn.label}
          </span>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none bg-transparent px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none"
      />
    </div>
  );
}
