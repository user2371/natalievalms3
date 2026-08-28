"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapLink from "@tiptap/extension-link";
import TiptapImage from "@tiptap/extension-image";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TiptapEditorProps {
  /** Початковий контент — серіалізований JSON з `Article.contentJson` (порожній рядок = новий, порожній документ). */
  initialContentJson: string;
  /** Викликається при КОЖНІЙ зміні документа — `editor.getJSON()` як рядок (задача 8.3.3, зберігає викликач форми). */
  onChangeJson: (json: string) => void;
  editable?: boolean;
  /**
   * ФАЗА HW+, задача HW+.2.1 (28.08.2026). Опційний реальний аплоад
   * зображення — повертає URL уже завантаженого файлу. Якщо передано,
   * кнопка тулбара "Зображення" відкриває файловий пікер замість
   * `window.prompt` за URL. Якщо НЕ передано (як і досі для
   * `AdminArticleEditor.tsx`/статей) — стара поведінка без жодних змін.
   */
  onUploadImage?: (file: File) => Promise<string>;
}

const EXTENSIONS = [
  StarterKit,
  TiptapLink.configure({ openOnClick: false, autolink: true }),
  TiptapImage,
];

function parseInitialContent(json: string): object | undefined {
  if (!json.trim()) return undefined;
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  label: string;
  disabled?: boolean;
  ariaBusy?: boolean;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  active,
  label,
  disabled,
  ariaBusy,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      aria-busy={ariaBusy}
      disabled={disabled}
      className={cn(
        "flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-accent-soft text-accent-dark"
          : "text-muted hover:bg-cream-soft hover:text-ink",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      {children}
    </button>
  );
}

interface ToolbarProps {
  editor: Editor;
  /** ФАЗА HW+, HW+.2.1 — див. `TiptapEditorProps.onUploadImage`. */
  onUploadImage?: (file: File) => Promise<string>;
}

function Toolbar({ editor, onUploadImage }: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function addLink() {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Посилання (URL):", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  /**
   * HW+.2.1 — якщо `onUploadImage` передано, кнопка відкриває
   * прихований `<input type="file">` (той самий UI-патерн, що
   * `UploadCertificateModal`, але без модалки — сам тулбар); інакше —
   * стара поведінка (`window.prompt` за URL), без жодних змін.
   */
  function addImage() {
    if (onUploadImage) {
      fileInputRef.current?.click();
      return;
    }
    const url = window.prompt("URL зображення:");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Скидаємо значення одразу — щоб повторний вибір ТОГО САМОГО файлу
    // знову спрацював (браузер інакше не викликає onChange вдруге).
    e.target.value = "";
    if (!file || !onUploadImage) return;

    setUploading(true);
    try {
      const url = await onUploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      // HW+.2.1 — мінімальний UX при помилці: `window.alert`, той самий
      // рівень, що вже в `addLink`/старому `addImage` (обидва теж без
      // спеціального UI-стану помилки).
      window.alert(err instanceof Error ? err.message : "Не вдалося завантажити зображення");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-rose-line/40 bg-cream-soft/50 px-2 py-1.5">
      <ToolbarButton
        label="Заголовок 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        label="Заголовок 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-rose-line/40" aria-hidden />
      <ToolbarButton
        label="Жирний"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <span className="font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton
        label="Курсив"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <span className="italic">I</span>
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-rose-line/40" aria-hidden />
      <ToolbarButton
        label="Маркований список"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        label="Нумерований список"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        label="Цитата"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        &ldquo;
      </ToolbarButton>
      <span className="mx-1 h-5 w-px bg-rose-line/40" aria-hidden />
      <ToolbarButton label="Посилання" active={editor.isActive("link")} onClick={addLink}>
        🔗
      </ToolbarButton>
      <ToolbarButton
        label="Зображення"
        onClick={addImage}
        disabled={uploading}
        ariaBusy={uploading}
      >
        {uploading ? "⏳" : "🖼"}
      </ToolbarButton>
      {onUploadImage && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelected}
        />
      )}
    </div>
  );
}

/**
 * `components/admin/TiptapEditor.tsx` (задачі 8.3.1/8.3.2) — реальний
 * Tiptap-редактор для статті уроку (`Article.contentJson`), замінює
 * декоративний `<textarea>`-тулбар, який раніше був у `ArticleForm.tsx`
 * (той компонент — для ІНШОЇ, ще не збудованої фічі, повноцінного
 * блогу з title/slug/SEO/тегами; тут — набагато простіша модель,
 * прив'язана саме до уроку, без жодного з цих полів).
 *
 * Розширення (задача 8.3.2 — "заголовки, списки, жирний/курсив,
 * посилання, зображення"): `StarterKit` (заголовки/параграфи/списки/
 * жирний/курсив/цитата з коробки) + `@tiptap/extension-link` +
 * `@tiptap/extension-image`. Зображення — за URL (той самий підхід, що
 * й обкладинка курсу, задача 8.1.6: немає підключеного файлового
 * сховища в проєкті).
 */
export function TiptapEditor({
  initialContentJson,
  onChangeJson,
  editable = true,
  onUploadImage,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: parseInitialContent(initialContentJson),
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChangeJson(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-4 py-3 focus:outline-none min-h-[240px]",
      },
    },
  });

  // Якщо initialContentJson прийшов ПІСЛЯ монтування (напр. дозавантажився
  // з сервера) — синхронізуємо редактор один раз, без втрати курсору при
  // кожному рендері (не викликаємо на кожен `onChangeJson`).
  useEffect(() => {
    if (!editor) return;
    const parsed = parseInitialContent(initialContentJson);
    if (parsed && editor.isEmpty) {
      editor.commands.setContent(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[280px] rounded-xl border border-rose-line/60 bg-cream-soft/40" />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-rose-line/60 bg-white focus-within:border-accent">
      {editable && <Toolbar editor={editor} onUploadImage={onUploadImage} />}
      <EditorContent editor={editor} />
    </div>
  );
}
