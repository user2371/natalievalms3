"use client";

import { Dropdown, DropdownTrigger, DropdownContent } from "@/components/ui/Dropdown";
import { SmileIcon } from "@/components/ui/icons";

/**
 * `components/messages/EmojiPickerDropdown.tsx` — ФАЗА MSG+, задача
 * MSG+.7.8 (07.09.2026, за прямим проханням користувача — "додай
 * можливість додавати смайли... в чаті"). Замінює колишню `disabled`
 * "візуальну" кнопку емодзі з MSG+.7.4 на дійсно робочий пікер.
 *
 * Статичний набір емодзі (без нової npm-залежності на emoji-picker/
 * emoji-mart) — той самий принцип "не тягнути важку залежність заради
 * невеликого UI-шматка", що вже в проєкті (напр. власний `Dropdown`
 * замість headless-UI бібліотеки). Категорії — той мінімум, що
 * природно очікується в чат-піднишці; список легко розширити пізніше,
 * не змінюючи контракт компонента (`onSelect(emoji: string)`).
 */
const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Емоції",
    emojis: [
      "😀", "😁", "😂", "🤣", "😊", "😍", "😘", "😉", "😎", "🤔",
      "😅", "😢", "😭", "😡", "😱", "🥰", "😴", "🤗", "🙃", "😇",
    ],
  },
  {
    label: "Жести й люди",
    emojis: [
      "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "✌️", "👋", "🤞",
    ],
  },
  {
    label: "Символи",
    emojis: [
      "❤️", "🔥", "✨", "🎉", "🎊", "💯", "⭐", "✅", "❗", "❓",
    ],
  },
  {
    label: "Манікюр",
    emojis: [
      "💅", "💇", "💄", "🌸", "🌺", "🎀",
    ],
  },
];

export interface EmojiPickerDropdownProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPickerDropdown({ onSelect }: EmojiPickerDropdownProps) {
  return (
    <Dropdown>
      <DropdownTrigger>
        <button
          type="button"
          aria-label="Додати емодзі"
          title="Емодзі"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-soft hover:text-ink"
        >
          <SmileIcon size={18} />
        </button>
      </DropdownTrigger>
      <DropdownContent
        align="right"
        side="top"
        className="w-72 max-h-72 overflow-y-auto"
      >
        <div className="flex flex-col gap-2 p-1">
          {EMOJI_CATEGORIES.map((category) => (
            <div key={category.label}>
              <p className="mb-1 px-1 text-xs font-medium text-muted">{category.label}</p>
              <div className="grid grid-cols-8 gap-0.5">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onSelect(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-cream-soft"
                    aria-label={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
