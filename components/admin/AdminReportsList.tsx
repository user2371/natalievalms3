"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPagination } from "@/components/admin/AdminPagination";
import type { MessageReportListItem } from "@/modules/messages";

const PAGE_SIZE = 10;

/**
 * `components/admin/AdminReportsList.tsx` — ФАЗА MSG+, задача MSG+.4.2
 * (04.09.2026). Той самий структурний патерн, що вже
 * `AdminCommentsList.tsx` (таблиця + `AdminPagination`), але без
 * видалення — єдина дія тут: перейти на `/admin/reports/[reportId]`,
 * де сам факт відкриття вже й буде "розглядом" (пише
 * `ConversationModerationLog`, `reviewReportService`).
 */
export function AdminReportsList({ reports }: { reports: MessageReportListItem[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));
  const visible = reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      {reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rose-line/60 px-6 py-14 text-center text-sm text-muted">
          Скарг поки немає.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-rose-line/40 bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-rose-line/30 text-xs tracking-wide text-muted uppercase">
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Скаржник</th>
                <th className="px-5 py-3 font-medium">Автор повідомлення</th>
                <th className="px-5 py-3 font-medium">Причина</th>
                <th className="px-5 py-3 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((report) => (
                <tr
                  key={report.id}
                  onClick={() => router.push(`/admin/reports/${report.id}`)}
                  className="cursor-pointer border-b border-rose-line/20 transition-colors last:border-0 hover:bg-cream-soft"
                >
                  <td className="px-5 py-4">
                    <span
                      className={
                        report.status === "PENDING"
                          ? "rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger"
                          : "rounded-full bg-cream-soft px-2.5 py-1 text-xs font-medium text-muted"
                      }
                    >
                      {report.status === "PENDING" ? "У черзі" : "Розглянуто"}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">{report.reporterLabel}</td>
                  <td className="px-5 py-4 text-muted">{report.messageSenderLabel}</td>
                  <td className="max-w-xs truncate px-5 py-4 text-muted">{report.reason}</td>
                  <td className="px-5 py-4 text-muted">
                    {new Date(report.createdAt).toLocaleDateString("uk-UA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reports.length > PAGE_SIZE && (
        <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
      )}
    </div>
  );
}
