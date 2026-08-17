export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Транслітерація українських кириличних літер у латиницю (стандартна
 * спрощена схема) — потрібна для `slugify`, бо назви курсів/уроків у
 * проєкті українською (наприклад, "Гель-лак для новачків" →
 * "gel-lak-dlya-novachkiv", той самий формат, що вже в `prisma/seed.ts`).
 */
const UK_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ye",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "yi",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "yu",
  я: "ya",
  "'": "",
  "’": "",
};

/**
 * Перетворює довільний текст (укр./лат.) у URL-friendly slug:
 * нижній регістр, транслітерація кирилиці, non-alphanumeric → `-`,
 * без повторних/крайніх дефісів. Використовується для генерації `slug`
 * курсів/уроків з `title` (`modules/courses/service.ts`, задача 3.3).
 */
export function slugify(text: string): string {
  const transliterated = text
    .toLowerCase()
    .split("")
    .map((char) => UK_TO_LATIN[char] ?? char)
    .join("");

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
