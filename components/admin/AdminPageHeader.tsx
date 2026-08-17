import { ReactNode } from "react";
import {
  AdminBreadcrumb,
  type AdminBreadcrumbItem,
} from "@/components/admin/AdminBreadcrumb";

export interface AdminPageHeaderProps {
  title: string;
  breadcrumb: AdminBreadcrumbItem[];
  action?: ReactNode;
}

/** Заголовок сторінки адмінки: хлібні крихти зверху, назва + опційна кнопка дії в один рядок. */
export function AdminPageHeader({ title, breadcrumb, action }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">{title}</h1>
        <div className="mt-1.5">
          <AdminBreadcrumb items={breadcrumb} />
        </div>
      </div>
      {action}
    </div>
  );
}
