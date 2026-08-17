import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EditIcon, PlayIcon, GraduationCapIcon } from "@/components/ui/icons";
import { getCourseByIdService } from "@/modules/courses";
import { listLessonsService } from "@/modules/lessons";

/**
 * Прев'ю курсу в адмінці, за мокапом `adminPanel.png` (правий екран
 * четвертого ряду): мініатюра з кнопкою відтворення, назва, кількість
 * уроків + статус публікації, короткий опис, кнопки "Редагувати курс" /
 * "Перейти до уроків".
 *
 * Не була буквально в переліку задач 8.1.1–8.1.7/8.2.1–8.2.3, але на неї
 * посилаються breadcrumb'и зі списку курсів (8.1.1) і зі списку уроків
 * (8.2.1) — з реальними `courseId` (UUID) стара версія на `ADMIN_COURSES`
 * (мок) завжди повертала б 404. Підключено до `getCourseByIdService`
 * (`modules/courses`) як необхідний супутній крок.
 */
export default async function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseByIdService(courseId);

  if (!course) notFound();

  const lessons = await listLessonsService(courseId);
  const lessonsCount = lessons.length;

  return (
    <div>
      <div className="mb-6">
        <AdminBreadcrumb
          items={[
            { label: "Головна", href: "/admin/courses" },
            { label: "Курси", href: "/admin/courses" },
            { label: course.title },
          ]}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-rose-line/40 bg-white">
        <div className="relative aspect-video w-full max-w-lg">
          {course.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.coverImage} alt="" className="h-full w-full object-cover" />
          )}
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-accent-dark shadow-sm">
              <PlayIcon size={20} />
            </span>
          </span>
        </div>

        <div className="p-6">
          <h1 className="font-serif text-2xl text-ink">{course.title}</h1>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-muted">
            <span>{lessonsCount} уроків</span>
            <span>•</span>
            <Badge variant={course.published ? "soft" : "outline"}>
              {course.published ? "Опубліковано" : "Не опубліковано"}
            </Badge>
          </div>
          <p className="mt-3 max-w-lg text-sm text-muted">{course.description}</p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/admin/courses/${course.id}/edit`}>
              <Button variant="outline" size="sm" icon={<EditIcon size={16} />}>
                Редагувати курс
              </Button>
            </Link>
            <Link href={`/admin/courses/${course.id}/lessons`}>
              <Button
                size="sm"
                icon={<GraduationCapIcon size={16} />}
                iconPosition="left"
              >
                Перейти до уроків
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
