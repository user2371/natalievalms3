"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/Avatar";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { Dropdown, DropdownTrigger, DropdownContent } from "@/components/ui/Dropdown";
import {
  ArrowLeftIcon,
  ChatIcon,
  CloseIcon,
  FlagIcon,
  MoreVerticalIcon,
  PaperclipIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
} from "@/components/ui/icons";
import { ReportMessageModal } from "@/components/messages/ReportMessageModal";
import { EmojiPickerDropdown } from "@/components/messages/EmojiPickerDropdown";
import { useAppSelector } from "@/lib/store/hooks";
import { useConversationRealtime } from "@/lib/realtime/useConversationRealtime";
import { validateFileBeforeUpload } from "@/lib/images/validateFileBeforeUpload";
import {
  blockUserAction,
  getBlockStatusAction,
  listMessagesAction,
  markConversationReadAction,
  reportMessageAction,
  sendMessageAction,
  unblockUserAction,
  uploadMessageImageAction,
  MESSAGE_IMAGE_ALLOWED_MIME_TYPES,
  MESSAGE_IMAGE_MAX_SIZE_BYTES,
} from "@/modules/messages";
import type { BlockStatus, Message, MessageParticipant } from "@/modules/messages";
import { cn } from "@/lib/utils";

const MESSAGES_PAGE_SIZE = 30;

/** Той самий `displayName`, що вже в `ConversationListPanel.tsx` — локальна копія, не спільна утиліта (усталений принцип проєкту — "одна функція на файл", див. коментар класу в старому `[conversationId]/page.tsx`, MSG+.3.2). */
function displayName(participant: MessageParticipant | null): string {
  if (!participant) return "Видалений користувач";
  if (participant.nickname) return participant.nickname;
  return `${participant.firstName}${participant.lastName ? ` ${participant.lastName}` : ""}`;
}

const TIME_FORMATTER = new Intl.DateTimeFormat("uk-UA", { hour: "2-digit", minute: "2-digit" });
const DAY_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export interface ChatPanelProps {
  conversationId: string;
  /** `undefined` — ще не завантажено (шапка-скелетон), `null` — розмову не знайдено в списку користувача (MSG+.3.2, той самий принцип). */
  otherParticipant: MessageParticipant | null | undefined;
  /** Приховує панель на мобільному, доки розмову не обрано (MSG+.7.4/.7.5 — `hidden md:flex`, той самий адаптив без JS-медіа-запитів, що `ConversationListPanel`). */
  className?: string;
}

/**
 * `components/messages/ChatPanel.tsx` — ФАЗА MSG+, задача MSG+.7.4
 * (редизайн `/messages` під спліт-в'ю макет `chatMockup.png`, за прямим
 * проханням користувача, 07.09.2026).
 *
 * Уся логіка чату — 1:1 перенесена з колишнього повноекранного
 * `app/messages/[conversationId]/page.tsx` (MSG+.3.2/.4.1): курсорна
 * пагінація історії, домердж Realtime-повідомлень (`useConversationRealtime`,
 * MSG+.2.3), автоскрол лише для нових/власних повідомлень, блокування
 * (MSG+.4.1) і скарги (MSG+.4.1) — без жодної зміни поведінки чи серверних
 * викликів, лише інша "рамка" навколо (панель спліт-в'ю замість
 * повноекранної сторінки з власним `Header`).
 *
 * Що змінилось порівняно з MSG+.3.2 (за макетом `chatMockup.png`):
 * - кнопка "Заблокувати"/"Розблокувати" й кнопка "поскаржитись на
 *   повідомлення" лишаються (сама модерація не змінена), але кнопка
 *   блокування в шапці переїхала під нову іконку "..." (`MoreVerticalIcon`)
 *   — за макетом шапка містить лише лупу пошуку й "...", не окрему
 *   кнопку тексту;
 * - лупа в шапці (нова, MSG+.7.4) відкриває поле пошуку по вже
 *   завантаженій історії повідомлень — той самий принцип, що пошук
 *   розмов у `ConversationListPanel` (клієнтський фільтр, БЕЗ нового
 *   server action: `listMessagesAction` і так вже тримає історію в
 *   пам'яті); знайдені повідомлення підсвічуються, а не приховують решту
 *   — щоб не губити контекст переписки;
 * - кнопки "прикріпити файл"/"емодзі" в полі вводу — на момент MSG+.7.4
 *   були ВІЗУАЛЬНИМИ (`disabled`, вкладення свідомо поза межами MVP,
 *   "MSG+.6 Свідомо поза межами цієї фази"). **MSG+.7.8 (07.09.2026, за
 *   прямим проханням користувача — "додай можливість додавати смайли і
 *   прикріпляти зображення в чаті") — ОБИДВІ кнопки тепер РОБОЧІ:**
 *   емодзі-пікер (`EmojiPickerDropdown`, статичний набір, без нової
 *   npm-залежності) вставляє символ у позицію курсора; скріпка відкриває
 *   вибір файлу й завантажує зображення через новий двоетапний флоу
 *   (`uploadMessageImageAction` → прев'ю з можливістю скасувати →
 *   `sendMessageAction` з уже готовим `imageUrl`), той самий Cloudinary-
 *   патерн, що вже `HW+.1.4`/`CERT+.1.6`. Детально — докблок над
 *   `handleAttachClick`/`handleFileChange` нижче;
 * - кнопка "Написати повідомлення" (значок олівця у шапці списку
 *   розмов) з макета СВІДОМО не реалізована: у проєкті й раніше не було
 *   окремого екрана "нова розмова" — розмова стартує лише з кнопки на
 *   `/users/[id]` (MSG+.3.3), і це не змінюється цією задачею (суто
 *   візуальний редизайн наявних екранів, не нова функціональність).
 */
export function ChatPanel({ conversationId, otherParticipant, className }: ChatPanelProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // MSG+.7.8 — прикріплене зображення: `previewUrl` (`URL.createObjectURL`)
  // показується одразу, ще до завершення мережевого аплоаду; `uploadedUrl`
  // з'являється лише після успішного `uploadMessageImageAction` і саме він
  // передається в `sendMessageAction` (не сам `File` — сервер уже не бачить
  // оригінальний файл вдруге, той самий двоетапний підхід, що вже ДЗ/
  // сертифікати).
  const [attachedImage, setAttachedImage] = useState<{
    previewUrl: string;
    uploading: boolean;
    uploadedUrl: string | null;
    error: string | null;
  } | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [blockStatus, setBlockStatus] = useState<BlockStatus | undefined>(undefined);
  const [blockPending, setBlockPending] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottom = useRef(true);
  // MSG+.7.8 — `textareaRef` потрібен емодзі-пікеру (вставка символу в
  // позицію курсора, не просто в кінець тексту); `fileInputRef` —
  // прихований `<input type="file">`, що відкривається кліком по кнопці
  // "скріпка" (той самий підхід, що вже `app/settings/page.tsx` для
  // аватарки: видима кнопка керує невидимим нативним input'ом).
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useConversationRealtime(conversationId);
  const realtimeMessages = useAppSelector(
    (state) => state.messages.messagesByConversation[conversationId],
  );

  useEffect(() => {
    if (!otherParticipant) return;
    let cancelled = false;
    getBlockStatusAction({ userId: otherParticipant.id })
      .then((result) => {
        if (!cancelled) setBlockStatus(result.status);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [otherParticipant]);

  async function handleToggleBlock() {
    if (!otherParticipant || blockPending) return;
    setBlockPending(true);
    try {
      const action = blockStatus?.blockedByMe ? unblockUserAction : blockUserAction;
      const result = await action({ userId: otherParticipant.id });
      if (result.success) {
        setBlockStatus((prev) => ({
          blockedByMe: !blockStatus?.blockedByMe,
          blockingMe: prev?.blockingMe ?? false,
        }));
      }
    } finally {
      setBlockPending(false);
    }
  }

  async function handleReport(reason: string) {
    if (!reportTarget) return;
    setReportSubmitting(true);
    try {
      const result = await reportMessageAction({ messageId: reportTarget, reason });
      setReportFeedback(
        result.success ? "Скаргу надіслано. Дякуємо — адміністратор розгляне її." : result.error,
      );
      if (result.success) setReportTarget(null);
    } finally {
      setReportSubmitting(false);
    }
  }

  // MSG+.7.9 — виправлення білда: `react-hooks/set-state-in-effect`
  // (нове правило в `eslint-config-next` 16.x) забороняє синхронний виклик
  // setState прямо в тілі useEffect. Скидання СТАНУ чату при перемиканні
  // розмови (`messages`/`nextCursor`/`attachedImage`) відбувається під
  // час рендеру — офіційний патерн React "adjusting state when a prop
  // changes"
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes):
  // `chatKey` порівнюється з уже обробленим значенням, і якщо він
  // змінився, стан скидається одразу ж, синхронно, до першого малювання
  // нової розмови. `shouldScrollToBottom` — це РЕФ, не стан: React явно
  // забороняє чіпати `ref.current` під час рендеру
  // (react-hooks/refs, "Cannot update ref during render") — тому його
  // мутація лишається в ефекті нижче (той самий ефект, що й так вже
  // спрацьовує на ту саму зміну `[conversationId, userId]`).
  const [loadedChatKey, setLoadedChatKey] = useState<string | null>(null);
  const chatKey = userId ? `${conversationId}:${userId}` : null;
  if (chatKey && chatKey !== loadedChatKey) {
    setLoadedChatKey(chatKey);
    setMessages(null);
    setNextCursor(null);
    // MSG+.7.8 — перемикання розмови скидає незавершений вибір
    // зображення попереднього чату (та звільняє його `previewUrl`
    // через `URL.createObjectURL`, щоб не текла пам'ять).
    setAttachedImage((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    shouldScrollToBottom.current = true;
    listMessagesAction({ conversationId, cursor: null, limit: MESSAGES_PAGE_SIZE })
      .then((result) => {
        if (cancelled || !result.success) return;
        setMessages([...result.messages].reverse());
        setNextCursor(result.nextCursor);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });
    markConversationReadAction({ conversationId }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [conversationId, userId]);

  useEffect(() => {
    if (!realtimeMessages || realtimeMessages.length === 0 || messages === null) return;
    let hadFresh = false;
    setMessages((prev) => {
      if (!prev) return prev;
      const known = new Set(prev.map((m) => m.id));
      const fresh = realtimeMessages
        .filter((m) => !known.has(m.id))
        .map((m) => ({ ...m, createdAt: new Date(m.createdAt) }));
      if (fresh.length === 0) return prev;
      hadFresh = true;
      shouldScrollToBottom.current = true;
      return [...prev, ...fresh];
    });
    if (hadFresh) {
      markConversationReadAction({ conversationId }).catch(() => {});
    }
  }, [realtimeMessages, conversationId, messages]);

  useEffect(() => {
    if (!shouldScrollToBottom.current || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    shouldScrollToBottom.current = false;
  }, [messages]);

  async function loadOlder() {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    const container = scrollRef.current;
    const previousScrollHeight = container?.scrollHeight ?? 0;
    try {
      const result = await listMessagesAction({
        conversationId,
        cursor: nextCursor,
        limit: MESSAGES_PAGE_SIZE,
      });
      if (!result.success) return;
      setMessages((prev) => [...[...result.messages].reverse(), ...(prev ?? [])]);
      setNextCursor(result.nextCursor);
      requestAnimationFrame(() => {
        if (!container) return;
        container.scrollTop = container.scrollHeight - previousScrollHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    // MSG+.7.8 — повідомлення валідне, якщо є текст АБО завершено
    // завантажене зображення (`SendMessageSchema.refine`, той самий
    // критерій на сервері) — порожній `trimmed` більше не блокує
    // надсилання, якщо `attachedImage.uploadedUrl` вже готовий. Поки
    // аплоад ще в процесі (`uploading: true`) — надсилати зарано, кнопка
    // й так задизейблена нижче (`disabled`), але та сама перевірка тут,
    // на випадок Enter у textarea (обходить `disabled` кнопки).
    const imageUrl = attachedImage?.uploadedUrl ?? null;
    if ((!trimmed && !imageUrl) || sending || attachedImage?.uploading) return;
    setSending(true);
    setSendError(null);
    try {
      const result = await sendMessageAction({ conversationId, body: trimmed, imageUrl });
      if (!result.success || !result.message) {
        setSendError(result.error ?? "Не вдалося надіслати повідомлення");
        return;
      }
      const sent = result.message;
      setMessages((prev) => {
        if (!prev) return prev;
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      shouldScrollToBottom.current = true;
      setBody("");
      if (attachedImage) {
        URL.revokeObjectURL(attachedImage.previewUrl);
        setAttachedImage(null);
      }
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as FormEvent);
    }
  }

  /**
   * MSG+.7.8 — вставляє емодзі в поточну позицію курсора textarea (не
   * просто в кінець `body`), той самий UX, що очікується від будь-якого
   * чат-клієнта: якщо курсор посеред уже набраного тексту, емодзі
   * з'являється саме там. `selectionStart`/`selectionEnd` беруться з
   * реального DOM-вузла (через `textareaRef`, MSG+.7.8-зміна
   * `Textarea.tsx` на `forwardRef`) — React-стан `body` сам по собі не
   * знає позицію курсора. Після вставки курсор явно повертається одразу
   * ПІСЛЯ вставленого емодзі (`requestAnimationFrame`, щоб `textarea`
   * встиг перерендеритись із новим `value` перед виставленням selection).
   */
  function handleEmojiSelect(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => prev + emoji);
      return;
    }
    const start = textarea.selectionStart ?? body.length;
    const end = textarea.selectionEnd ?? body.length;
    const nextBody = body.slice(0, start) + emoji + body.slice(end);
    setBody(nextBody);
    const nextCursor = start + emoji.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  /**
   * MSG+.7.8 — обробник вибору файлу-зображення для прикріплення до
   * повідомлення. Той самий двокроковий захист, що вже
   * `handleAvatarFileChange` (`app/settings/page.tsx`, IMG+.2.6):
   * дешева клієнтська перевірка (`validateFileBeforeUpload`) ще ДО
   * мережевого запиту, а справжня валідація вмісту файлу — на сервері
   * (`uploadMessageImageService` → `processUploadedImage`). Локальний
   * `previewUrl` (`URL.createObjectURL`) показується ОДРАЗУ — не чекає
   * завершення аплоаду, лише позначений `uploading: true` до готовності
   * `uploadedUrl` (кнопка "Надіслати" лишається заблокованою весь цей
   * час, `handleSend` нижче).
   */
  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // дозволяє повторно вибрати той самий файл наступного разу
    if (!file) return;

    const validationError = validateFileBeforeUpload(file, {
      maxSizeBytes: MESSAGE_IMAGE_MAX_SIZE_BYTES,
      allowedMimeTypes: MESSAGE_IMAGE_ALLOWED_MIME_TYPES,
      maxSizeErrorMessage: "Розмір файлу перевищує 5MB",
      formatErrorMessage: "Дозволені лише зображення у форматі JPG, PNG або WebP",
    });

    const previewUrl = URL.createObjectURL(file);
    if (validationError) {
      setAttachedImage({ previewUrl, uploading: false, uploadedUrl: null, error: validationError });
      return;
    }

    setAttachedImage({ previewUrl, uploading: true, uploadedUrl: null, error: null });

    try {
      const formData = new FormData();
      formData.append("conversationId", conversationId);
      formData.append("image", file);
      const result = await uploadMessageImageAction(formData);

      setAttachedImage((prev) => {
        // Користувач міг натиснути "✕" (скасувати) поки йшло завантаження.
        if (!prev || prev.previewUrl !== previewUrl) return prev;
        if (!result.success || !result.url) {
          return { ...prev, uploading: false, error: result.error ?? "Не вдалося завантажити зображення" };
        }
        return { ...prev, uploading: false, uploadedUrl: result.url, error: null };
      });
    } catch {
      setAttachedImage((prev) =>
        prev && prev.previewUrl === previewUrl
          ? { ...prev, uploading: false, error: "Не вдалося завантажити зображення" }
          : prev,
      );
    }
  }

  function handleRemoveAttachment() {
    if (attachedImage) {
      URL.revokeObjectURL(attachedImage.previewUrl);
    }
    setAttachedImage(null);
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const isBlocked = !!blockStatus && (blockStatus.blockedByMe || blockStatus.blockingMe);

  return (
    <div className={cn("flex w-full flex-1 flex-col", className)}>
      <div className="flex items-center gap-3 border-b border-rose-line/40 px-4 py-4 sm:px-5">
        <Link
          href="/messages"
          aria-label="До списку розмов"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-cream-soft md:hidden"
        >
          <ArrowLeftIcon size={18} />
        </Link>
        {otherParticipant === undefined ? (
          <>
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <Avatar name={displayName(otherParticipant)} src={otherParticipant?.avatarUrl} size={40} />
            <p className="flex-1 truncate font-serif text-lg text-ink">
              {displayName(otherParticipant)}
            </p>
          </>
        )}

        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-label="Пошук у повідомленнях"
          aria-pressed={searchOpen}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors",
            searchOpen ? "bg-accent-soft text-accent-dark" : "text-ink/70 hover:bg-cream-soft",
          )}
        >
          <SearchIcon size={18} />
        </button>

        {otherParticipant && (
          <Dropdown>
            <DropdownTrigger>
              <button
                type="button"
                aria-label="Ще"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-cream-soft"
              >
                <MoreVerticalIcon size={18} />
              </button>
            </DropdownTrigger>
            <DropdownContent align="right">
              <button
                type="button"
                onClick={handleToggleBlock}
                disabled={blockPending || blockStatus === undefined}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink hover:bg-cream-soft disabled:opacity-50"
              >
                <ShieldIcon size={18} className="text-accent" />
                {blockStatus?.blockedByMe ? "Розблокувати" : "Заблокувати"}
              </button>
            </DropdownContent>
          </Dropdown>
        )}
      </div>

      {searchOpen && (
        <div className="border-b border-rose-line/40 px-4 py-3 sm:px-5">
          <label className="relative block">
            <SearchIcon
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="search"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Пошук у цій розмові"
              aria-label="Пошук у повідомленнях цієї розмови"
              className="w-full rounded-full border border-rose-line/50 bg-cream-soft/60 py-2 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </label>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        {messages === null ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className={i % 2 ? "ml-auto h-9 w-40" : "h-9 w-48"} />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
              <ChatIcon size={22} />
            </span>
            <p className="font-serif text-lg text-ink">Ще немає повідомлень</p>
            <p className="max-w-xs text-sm text-muted">Напишіть перше повідомлення нижче.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {nextCursor && (
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingOlder}
                className="mx-auto mb-3 rounded-full border border-rose-line/60 px-4 py-1.5 text-xs text-muted hover:bg-cream-soft disabled:opacity-50"
              >
                {loadingOlder ? "Завантаження…" : "Завантажити старіші повідомлення"}
              </button>
            )}
            {messages.map((message, index) => {
              const isOwn = message.senderId === userId;
              const prev = messages[index - 1];
              const showDaySeparator =
                !prev || !isSameDay(new Date(prev.createdAt), new Date(message.createdAt));
              const matchesSearch =
                normalizedSearch.length > 0 && message.body.toLowerCase().includes(normalizedSearch);
              return (
                <div key={message.id}>
                  {showDaySeparator && (
                    <p className="my-3 text-center text-xs text-muted">
                      {DAY_FORMATTER.format(new Date(message.createdAt))}
                    </p>
                  )}
                  <div className={isOwn ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={cn(
                        isOwn
                          ? "max-w-[75%] rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-sm text-white"
                          : "max-w-[75%] rounded-2xl rounded-bl-sm bg-cream-soft px-4 py-2 text-sm text-ink",
                        matchesSearch && "ring-2 ring-accent-dark ring-offset-2 ring-offset-cream",
                      )}
                    >
                      {/* MSG+.7.8 — вкладене зображення (за наявності) рендериться
                          НАД текстом бульбашки; клік відкриває більшу версію в
                          лайтбоксі (`Modal variant="media"`, той самий патерн, що
                          вже сертифікати, CERT+.2.7/CERTTPL+.0.4). `eslint-disable`
                          — той самий підхід, що вже `CertificateThumbnail.tsx`:
                          зображення з Cloudinary, не з локального `public/`, тому
                          `next/image` тут не застосовний без додаткової конфігурації
                          домену заради одного місця використання. */}
                      {message.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={message.imageUrl}
                          alt="Зображення в повідомленні"
                          onClick={() => setLightboxUrl(message.imageUrl)}
                          className="mb-1.5 max-h-64 w-full cursor-zoom-in rounded-xl object-cover"
                        />
                      )}
                      {message.body && (
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      )}
                      <div className="mt-1 flex items-center justify-end gap-2">
                        {!isOwn && message.senderId && (
                          <button
                            type="button"
                            onClick={() => {
                              setReportFeedback(null);
                              setReportTarget(message.id);
                            }}
                            aria-label="Поскаржитись на повідомлення"
                            className="text-muted/70 transition-colors hover:text-danger"
                          >
                            <FlagIcon size={12} />
                          </button>
                        )}
                        <p className={isOwn ? "text-[10px] text-white/70" : "text-[10px] text-muted"}>
                          {TIME_FORMATTER.format(new Date(message.createdAt))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-rose-line/40 px-4 py-3 sm:px-5">
        {isBlocked ? (
          <p className="rounded-xl border border-rose-line/60 bg-cream-soft px-4 py-3 text-center text-sm text-muted">
            {blockStatus?.blockedByMe
              ? "Ви заблокували цього користувача — спілкування недоступне."
              : "Спілкування з цим користувачем недоступне."}
          </p>
        ) : (
          <>
            {/* MSG+.7.8 — прев'ю прикріпленого зображення НАД полем вводу, поки
                повідомлення ще не надіслано: мініатюра, індикатор завантаження
                (`attachedImage.uploading`), кнопка "✕" (скасувати) і, за
                наявності, українське повідомлення про помилку (завеликий
                файл/непідтримуваний формат/збій мережі). */}
            {attachedImage && (
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-rose-line/50 bg-cream-soft/60 px-3 py-2">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-rose-line/40 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachedImage.previewUrl}
                    alt="Прев'ю прикріпленого зображення"
                    className="h-full w-full object-cover"
                  />
                  {attachedImage.uploading && (
                    <span className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-ink">
                    {attachedImage.uploading
                      ? "Завантаження зображення…"
                      : attachedImage.error
                        ? attachedImage.error
                        : "Зображення готове до надсилання"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  aria-label="Скасувати прикріплене зображення"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-white hover:text-danger"
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            )}
            <form onSubmit={handleSend} className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={MESSAGE_IMAGE_ALLOWED_MIME_TYPES.join(",")}
                onChange={handleFileChange}
                className="hidden"
                aria-hidden="true"
                tabIndex={-1}
              />
              <button
                type="button"
                onClick={handleAttachClick}
                title="Прикріпити зображення"
                aria-label="Прикріпити зображення"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-soft hover:text-ink"
              >
                <PaperclipIcon size={18} />
              </button>
              <Textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Напишіть повідомлення…"
                rows={1}
                className="max-h-32"
                aria-label="Текст повідомлення"
              />
              <EmojiPickerDropdown onSelect={handleEmojiSelect} />
              <button
                type="submit"
                disabled={(!body.trim() && !attachedImage?.uploadedUrl) || sending || attachedImage?.uploading}
                aria-label="Надіслати"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
              >
                {sending ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <SendIcon size={17} />
                )}
              </button>
            </form>
          </>
        )}
        {sendError && <p className="mt-1.5 text-xs text-danger">{sendError}</p>}
        {reportFeedback && <p className="mt-1.5 text-xs text-muted">{reportFeedback}</p>}
      </div>

      <ReportMessageModal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReport}
        submitting={reportSubmitting}
      />

      {/* MSG+.7.8 — лайтбокс вкладеного зображення, той самий `Modal
          variant="media"` патерн, що вже `CertificateCard`/
          `CertificateThumbnail` (CERT+.2.7/CERTTPL+.0.4): клік по
          зображенню в бульбашці відкриває більшу версію поверх чату. */}
      <Modal
        open={lightboxUrl !== null}
        onClose={() => setLightboxUrl(null)}
        variant="media"
        labelledBy="message-image-lightbox-title"
      >
        <div className="mb-2 flex items-center justify-between gap-4">
          <h2 id="message-image-lightbox-title" className="sr-only">
            Зображення в повідомленні
          </h2>
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            aria-label="Закрити"
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-soft/40 hover:text-ink"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        {lightboxUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lightboxUrl} alt="Зображення в повідомленні" className="w-full rounded-xl object-contain" />
        )}
      </Modal>
    </div>
  );
}
