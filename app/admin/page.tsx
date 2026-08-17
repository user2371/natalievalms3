import { redirect } from "next/navigation";

/** Корінь адмінки `/admin` веде одразу на список курсів — головний розділ адмінки. */
export default function AdminIndexPage() {
  redirect("/admin/courses");
}
