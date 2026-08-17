import { Spinner } from "@/components/ui/Spinner";

/**
 * Окремий `loading.tsx` для `/admin/*` (а не лише кореневий
 * `app/loading.tsx`) — щоб під час навігації всередині адмінки не
 * зникала структура сторінки, а показувався компактний преloader без
 * `min-h-screen` (адмінка вже має власний layout з сайдбаром/шапкою).
 * Покриває всі async server-сторінки `/admin/**`
 * (`app/admin/courses/page.tsx`, `app/admin/comments/page.tsx`,
 * `app/admin/users/page.tsx`, `app/admin/courses/[courseId]/...` тощо),
 * які самі не мають власного `loading.tsx`.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-[50vh] flex-1 items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  );
}
