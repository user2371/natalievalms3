"use client";

import { use, useEffect, useRef, useState, type KeyboardEvent, type FormEvent } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { GuestGate } from "@/components/account/GuestGate";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeftIcon, ChatIcon, FlagIcon, ShieldIcon } from "@/components/ui/icons";
import { ReportMessageModal } from "@/components/messages/ReportMessageModal";
import { useAppSelector } from "@/lib/store/hooks";
import { useConversationRealtime } from "@/lib/realtime/useConversationRealtime";
import {
  blockUserAction,
  getBlockStatusAction,
  listConversationsAction,
  listMessagesAction,
  markConversationReadAction,
  reportMessageAction,
  sendMessageAction,
  unblockUserAction,
} from "@/modules/messages";
import type { BlockStatus, Message, MessageParticipant } from "@/modules/messages";

export const dynamic = "force-dynamic";

const MESSAGES_PAGE_SIZE = 30;

/** Той самий `displayName`, що вже в `app/messages/page.tsx` — локальна копія (не спільна утиліта), той самий підхід, що вже `DATE_FORMATTER`/подібні дрібні хелпери по проєкту (одна функція на файл, а не спільний `lib/`). */
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

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

/**
 * `app/messages/[conversationId]/page.tsx` — ФАЗА MSG+, задача MSG+.3.2
 * (03.09.2026, за прямим проханням користувача — "бери msg+3").
 *
 * Каркас навмисно ЛЕГШИЙ за `AccountLayout` (просто `Header` + повноекранний
 * чат, без сайдбару/нижньої панелі кабінету) — той самий підхід, що вже на
 * фокусних екранах на кшталт `/courses/[slug]/lessons/[lessonId]`: сайдбар
 * кабінету й так дублює навігацію, яку користувач щойно використав
 * (клікнув на розмову зі списку), а нижня мобільна панель кабінету забрала
 * б вертикальний простір саме там, де він найпотрібніший — під полем
 * вводу.
 *
 * "Хто співрозмовник" (аватар/нік у шапці й для чужих бульбашок) — навмисно
 * БЕЗ нового server action: перевикористано вже готовий
 * `listConversationsAction` (MSG+.1/.3.1) і знайдено запис за `conversationId`
 * — той самий принцип, що вже в MSG+.2 ("дані наперед, без дублювання
 * бекенд-логіки заради одного екрана"). Якщо запис ще не встиг зʼявитись
 * у списку (щойно створена розмова, перший рендер списку в польоті) —
 * показуємо нейтральний плейсхолдер замість помилки; сама історія
 * повідомлень (`listMessagesAction`) від цього не залежить.
 *
 * Пагінація "довантажити старіші" (MSG+.3.2) — КНОПКА зверху історії, а не
 * автотригер по скролу вгору (`IntersectionObserver`/`onScroll`): у
 * проєкті вже є усталений патерн саме такої пагінації —
 * "Показати ще"/`visibleCount` в `RealCommentsBlock.tsx`
 * (`components/lesson/RealCommentsBlock.tsx`) — той самий підхід тут,
 * а не новий клас патерну лише для одного екрана.
 */
export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [otherParticipant, setOtherParticipant] = useState<MessageParticipant | null | undefined>(
    undefined,
  );
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // MSG+.4.1 (04.09.2026) — стан блокування між поточним юзером і
  // співрозмовником; `undefined` — ще не завантажено (той самий
  // `undefined`-паттерн, що вже `otherParticipant` вище, для скелетону
  // замість "блимання" дефолтним станом).
  const [blockStatus, setBlockStatus] = useState<BlockStatus | undefined>(undefined);
  const [blockPending, setBlockPending] = useState(false);
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottom = useRef(true);

  // MSG+.2.3 — підписка на нові повідомлення саме цієї розмови.
  useConversationRealtime(conversationId);
  const realtimeMessages = useAppSelector(
    (state) => state.messages.messagesByConversation[conversationId],
  );

  // Хто співрозмовник — для шапки й підпису чужих бульбашок (див. коментар класу вище).
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    listConversationsAction()
      .then((result) => {
        if (cancelled || !result.success) return;
        const match = result.conversations.find((c) => c.id === conversationId);
        setOtherParticipant(match ? match.otherParticipant : null);
      })
      .catch(() => {
        if (!cancelled) setOtherParticipant(null);
      });
    return () => {
      cancelled = true;
    };
  }, [conversationId, userId]);

  // MSG+.4.1 — стан блокування залежить від `otherParticipant.id`, тому
  // окремий ефект від того, що завантажує самого `otherParticipant` вище
  // (спрацьовує щойно `otherParticipant` стає відомим, не раніше —
  // `null`/`undefined` пропускаємо, писати нема кого блокувати).
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

  // Перша сторінка історії + позначення прочитаним при відкритті екрана.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    shouldScrollToBottom.current = true;
    listMessagesAction({ conversationId, cursor: null, limit: MESSAGES_PAGE_SIZE })
      .then((result) => {
        if (cancelled || !result.success) return;
        // `listMessagesService` віддає найновіші першими (DESC) — для
        // читабельного чату розвертаємо у хронологічний порядок (старіші
        // згори, найновіші знизу).
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

  // Домерджити нові Realtime-повідомлення (MSG+.2.3) в локальну історію —
  // дедуп за `id` (той самий `.some(...)`-принцип, що вже в самому слайсі).
  // `messages` навмисно в залежностях (потрібен для актуального `known`-сету
  // на кожен новий realtime-масив) — з цим ефект неминуче спрацьовує ще раз
  // після власного `setMessages` нижче; `hadFresh` захищає від зайвого
  // повторного `markConversationReadAction` на тому другому, "порожньому"
  // прогоні (fresh.length===0 → `setMessages` повертає той самий `prev`,
  // React і так не перерендерить, але сам ефект однаково виконався б).
  useEffect(() => {
    if (!realtimeMessages || realtimeMessages.length === 0 || messages === null) return;
    let hadFresh = false;
    setMessages((prev) => {
      if (!prev) return prev;
      const known = new Set(prev.map((m) => m.id));
      const fresh = realtimeMessages.filter((m) => !known.has(m.id));
      if (fresh.length === 0) return prev;
      hadFresh = true;
      shouldScrollToBottom.current = true;
      return [...prev, ...fresh];
    });
    if (hadFresh) {
      // Дійшло нове повідомлення, поки екран розмови відкритий — одразу
      // позначаємо прочитаним (той самий виклик, що й на монтуванні вище).
      markConversationReadAction({ conversationId }).catch(() => {});
    }
  }, [realtimeMessages, conversationId, messages]);

  // Автоскрол донизу — лише для нових повідомлень (свій відправлений/
  // realtime), НЕ для щойно довантажених старіших (там позиція має
  // лишитись на місці, інакше екран "стрибне" вниз під час читання історії).
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
      // Зберегти видиму позицію скролу після того, як старіші повідомлення
      // дописались ЗГОРИ (інакше браузер лишає `scrollTop` тим самим числом
      // пікселів, і видима ділянка "з'їжджає" вгору на всю висоту нового
      // блоку) — компенсуємо різницею висоти контейнера до/після.
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
    if (!trimmed || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const result = await sendMessageAction({ conversationId, body: trimmed });
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

  if (status === "unauthenticated") {
    return <GuestGate description="приватних повідомлень" />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3 border-b border-rose-line/40 pb-4">
          <Link
            href="/messages"
            aria-label="До списку розмов"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 hover:bg-cream-soft"
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
              <Avatar
                name={displayName(otherParticipant)}
                src={otherParticipant?.avatarUrl}
                size={40}
              />
              <p className="flex-1 font-serif text-lg text-ink">{displayName(otherParticipant)}</p>
              {/* MSG+.4.1 (04.09.2026): кнопка видима лише коли живий співрозмовник — блокувати "Видаленого користувача" (`otherParticipant === null`) немає кого. */}
              {otherParticipant && (
                <button
                  type="button"
                  onClick={handleToggleBlock}
                  disabled={blockPending || blockStatus === undefined}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-rose-line/60 px-3 py-1.5 text-xs text-muted transition-colors hover:bg-cream-soft disabled:opacity-50"
                >
                  <ShieldIcon size={14} />
                  {blockStatus?.blockedByMe ? "Розблокувати" : "Заблокувати"}
                </button>
              )}
            </>
          )}
        </div>

        <div
          ref={scrollRef}
          className="mt-4 flex-1 overflow-y-auto rounded-2xl border border-rose-line/40 bg-white p-4"
          style={{ maxHeight: "65dvh" }}
        >
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
                return (
                  <div key={message.id}>
                    {showDaySeparator && (
                      <p className="my-3 text-center text-xs text-muted">
                        {DAY_FORMATTER.format(new Date(message.createdAt))}
                      </p>
                    )}
                    <div className={isOwn ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={
                          isOwn
                            ? "max-w-[75%] rounded-2xl rounded-br-sm bg-accent px-4 py-2 text-sm text-white"
                            : "max-w-[75%] rounded-2xl rounded-bl-sm bg-cream-soft px-4 py-2 text-sm text-ink"
                        }
                      >
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        <div
                          className={
                            isOwn
                              ? "mt-1 flex items-center justify-end gap-2"
                              : "mt-1 flex items-center justify-end gap-2"
                          }
                        >
                          {/* MSG+.4.1: скаржитись можна лише на ЧУЖЕ повідомлення живого автора — `senderId === null` вже "Видалений користувач", скаржитись нема на кого. */}
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
                          <p
                            className={
                              isOwn ? "text-[10px] text-white/70" : "text-[10px] text-muted"
                            }
                          >
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

        {/* MSG+.4.1: поле вводу ховається за банером, коли блокування діє в
            БУДЬ-ЯКИЙ бік (`blockedByMe`/`blockingMe`) — той самий принцип,
            що вже `assertNotBlocked` на сервері: банер лише пояснює UI, не
            єдиний захист (`sendMessageAction` все одно впаде з тією самою
            помилкою при прямому виклику). Поки `blockStatus === undefined`
            (ще не завантажено) — форма показується як завжди, щоб не
            блимати банером на кожному відкритті екрана. */}
        {blockStatus && (blockStatus.blockedByMe || blockStatus.blockingMe) ? (
          <p className="mt-3 rounded-xl border border-rose-line/60 bg-cream-soft px-4 py-3 text-center text-sm text-muted">
            {blockStatus.blockedByMe
              ? "Ви заблокували цього користувача — спілкування недоступне."
              : "Спілкування з цим користувачем недоступне."}
          </p>
        ) : (
          <form onSubmit={handleSend} className="mt-3 flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Написати повідомлення…"
              rows={1}
              className="max-h-32"
              aria-label="Текст повідомлення"
            />
            <Button type="submit" disabled={!body.trim()} loading={sending}>
              Надіслати
            </Button>
          </form>
        )}
        {sendError && <p className="mt-1.5 text-xs text-danger">{sendError}</p>}
        {reportFeedback && <p className="mt-1.5 text-xs text-muted">{reportFeedback}</p>}
      </main>

      <ReportMessageModal
        open={reportTarget !== null}
        onClose={() => setReportTarget(null)}
        onSubmit={handleReport}
        submitting={reportSubmitting}
      />
    </div>
  );
}
