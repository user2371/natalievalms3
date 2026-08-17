import Link from "next/link";
import { Fragment } from "react";

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Хлібні крихти адмінки ("Головна / Курси / Новий курс"), за мокапом
 * `adminPanel.png` — використовуються на всіх сторінках адмінки під
 * заголовком.
 */
export function AdminBreadcrumb({ items }: { items: AdminBreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Хлібні крихти"
      className="flex flex-wrap items-center gap-1.5 text-sm"
    >
      {items.map((item, i) => (
        <Fragment key={item.label}>
          {i > 0 && <span className="text-rose-line">/</span>}
          {item.href ? (
            <Link href={item.href} className="text-muted hover:text-accent-dark">
              {item.label}
            </Link>
          ) : (
            <span className="text-muted">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
