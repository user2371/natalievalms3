"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ShieldIcon } from "@/components/ui/icons";
import { markReportReviewedAction } from "@/modules/messages";
import type { Message, MessageParticipant, ReportReviewData } from "@/modules/messages";

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Той самий локальний `displayName`, що вже `app/messages/[conversationId]/page.tsx` — тут читає з `Message.sender`/`senderLabel`, не з окремого `otherParticipant`, бо адмін бачить ОБОХ учасників, не одного "співрозмовника". */
function senderLabel(message: Message): string {
  if (message.sender) {
    if (message.sender.nickname) return message.sender.nickname;
    return `${message.sender.firstName}${message.sender.lastName ? ` ${message.sender.lastName}` : ""}`;
  }
  return message.senderLabel ?? "Видалений користувач";
}

function participantLabel(participant: MessageParticipant): string {
  if (participant.nickname) return participant.nickname;
  return `${participant.firstName}${participant.lastName ? ` ${participant.lastName}` : ""}`;
}

/**
 * `components/admin/AdminReportReview.tsx` — ФАЗА MSG+, задача MSG+.4.2
 * (04.09.2026). Сама сторінка `/admin/reports/[reportId]/page.tsx`
 * (Server Component) уже викликала `reviewReportService` — тобто рядок
 * аудит-сліду вже записано ДО того, як цей компонент відрендерився;
 * тут лише показ даних + кнопка "Позначити розглянутим" (не сам
 * перегляд контенту, той факт уже зафіксовано на сервері).
 */
export function AdminReportReview({ data }: { data: ReportReviewData }) {
  const [status, setStatus] = useState(data.report.status);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkReviewed() {
    setSubmitting(true);
    setError(null);
    const result = await markReportReviewedAction({ reportId: data.report.id });
    setSubmitting(false);
    if (result.success) {
      setStatus("REVIEWED");
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-rose-line/40 bg-white">
        <div className="border-b border-rose-line/30 px-5 py-3 text-xs font-medium tracking-wide text-muted uppercase">
          Переписка (
          {data.otherParticipants.map((p) => participantLabel(p)).join(" ↔ ") || "розмова"})
        </div>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-5 py-4">
          {data.messages.map((message) => {
            const isReported = message.id === data.report.messageId;
            return (
              <div
                key={message.id}
                className={
                  isReported
                    ? "rounded-xl border border-danger/40 bg-danger/5 p-3"
                    : "rounded-xl border border-transparent p-3"
                }
              >
                <div className="flex items-center justify-between gap-3 text-xs text-muted">
                  <span className="font-medium text-ink">{senderLabel(message)}</span>
                  <span>{DATE_TIME_FORMATTER.format(new Date(message.createdAt))}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{message.body}</p>
                {isReported && (
                  <p className="mt-2 text-xs font-medium text-danger">
                    ← репортнуте повідомлення (текст вище — поточний; знімок на момент скарги
                    праворуч)
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-rose-line/40 bg-white p-5">
          <div className="flex items-center justify-between">
            <span
              className={
                status === "PENDING"
                  ? "rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger"
                  : "rounded-full bg-cream-soft px-2.5 py-1 text-xs font-medium text-muted"
              }
            >
              {status === "PENDING" ? "У черзі" : "Розглянуто"}
            </span>
            <span className="text-xs text-muted">
              {DATE_TIME_FORMATTER.format(new Date(data.report.createdAt))}
            </span>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs text-muted">Скаржник</dt>
              <dd className="text-ink">{data.report.reporterLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Автор репортнутого повідомлення</dt>
              <dd className="text-ink">{data.report.messageSenderLabel}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Причина</dt>
              <dd className="whitespace-pre-wrap text-ink">{data.report.reason}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Знімок тексту на момент скарги</dt>
              <dd className="whitespace-pre-wrap text-ink">{data.report.messageBodySnapshot}</dd>
            </div>
          </dl>

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}

          {status === "PENDING" && (
            <Button className="mt-4 w-full" size="sm" onClick={handleMarkReviewed} loading={submitting}>
              Позначити розглянутим
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-rose-line/40 bg-white p-5">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted uppercase">
            <ShieldIcon size={14} />
            Аудит перегляду
          </div>
          <ul className="mt-3 space-y-2 text-xs text-muted">
            {data.logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-2">
                <span className="text-ink">{log.adminLabel}</span>
                <span>{DATE_TIME_FORMATTER.format(new Date(log.viewedAt))}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/admin/reports" className="block text-center text-xs text-muted hover:text-ink">
          ← До списку скарг
        </Link>
      </div>
    </div>
  );
}
