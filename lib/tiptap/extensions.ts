import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { Details, DetailsSummary, DetailsContent } from "@tiptap/extension-details";
import { TableKit } from "@tiptap/extension-table";

/**
 * ФАЗА FLOAT+, задача FLOAT+.0.1 (31.08.2026). Єдине джерело правди для
 * набору Tiptap-розширень — раніше три незалежні копії `[StarterKit,
 * TiptapLink, TiptapImage]` у `TiptapEditor.tsx`, `ArticleRenderer.tsx`
 * і `HomeworkAssignmentRenderer.tsx`, з ризиком розсинхронізації при
 * майбутніх правках. Тепер усі три імпортують `TIPTAP_EXTENSIONS`
 * звідси.
 */

/**
 * ФАЗА FLOAT+, задача FLOAT+.0.2. Розширення базового `TiptapImage` —
 * додає атрибут `align` (`"left" | "right" | null`, дефолт `null`) для
 * обтікання тексту (float left/right) навколо зображення в статтях і
 * ДЗ.
 *
 * `parseHTML` читає `data-align` з наявного `<img>` — зворотна
 * сумісність зі старим контентом без обтікання: атрибута просто нема,
 * `align` лишається `null`.
 *
 * `renderHTML` дописує `data-align` в атрибути тега ЛИШЕ якщо значення
 * не `null` — старий контент без обтікання рендериться 1:1, як і
 * зараз, без зайвого `data-align="null"` у розмітці.
 */
const FloatImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-align") || null,
        renderHTML: (attributes) => {
          if (!attributes.align) return {};
          return { "data-align": attributes.align };
        },
      },
    };
  },
});

/**
 * ФАЗА RICH+, задача RICH+.0.1 (01.09.2026, прохання користувача:
 * "додай можливість ховати під спойлери і створювати таблиці").
 *
 * Спойлер — офіційний `@tiptap/extension-details` (пакет-тріо
 * `Details`/`DetailsSummary`/`DetailsContent`, та сама модель, що HTML
 * `<details>`/`<summary>`): `Details` — обгортка-нода, `DetailsSummary`
 * — завжди видимий заголовок (те, що студент бачить одразу),
 * `DetailsContent` — тіло, яке ховається/показується по кліку.
 *
 * `persist: false` (дефолт пакета, лишили явним) — стан
 * відкрито/закрито НЕ зберігається в `contentJson`: кожен новий рендер
 * (і в адмінському прев'ю, і на сторінці уроку в студента) стартує
 * закритим — саме поведінка "спойлера" (ховати вміст, доки не
 * натиснуть), а не разова нотатка "заверни це не важливо, я вже
 * подивилась".
 */
const TIPTAP_DETAILS = [
  Details.configure({ persist: false }),
  DetailsSummary,
  DetailsContent,
];

/**
 * ФАЗА RICH+, задача RICH+.0.2. Таблиці — офіційний
 * `@tiptap/extension-table`, зібраний у єдиний `TableKit`
 * (`Table`/`TableRow`/`TableCell`/`TableHeader` одним пакетом у v3,
 * замість чотирьох окремих залежностей у v2).
 *
 * `resizable: false` — свідомо БЕЗ перетягування меж колонок мишею
 * (той самий принцип мінімалізму, що вже в FLOAT+.1.3 — "без нової
 * залежності на bubble-menu"): перетягування колонок вимагає
 * додаткового JS-обробника ресайзу та CSS для "ручок" на межах, що
 * тут не додає цінності для простих таблиць уроку/ДЗ. Ширину колонок
 * можна й так вирівняти вручну через порожні клітинки/перенос тексту.
 */
const TIPTAP_TABLE = [TableKit.configure({ table: { resizable: false } })];

export const TIPTAP_EXTENSIONS = [
  StarterKit,
  TiptapLink.configure({ openOnClick: false, autolink: true }),
  FloatImage,
  ...TIPTAP_DETAILS,
  ...TIPTAP_TABLE,
];
