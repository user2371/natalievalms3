import Link from "next/link";
import Image from "next/image";
import { ArrowRightIcon, UsersIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import type { Course } from "@/lib/data/courses";

export interface CourseCardProps {
  course: Course;
  className?: string;
  /**
   * Перевизначає адресу картки (за замовчуванням `/lessons`) — задача
   * 3.21: коли в БД є реальний курс з тим самим `slug`, картка веде на
   * `/courses/[slug]` (реальний роут, задача 3.14) замість застарілого
   * хардкоду `/lessons`. Дизайн картки не змінюється, лише посилання.
   */
  href?: string;
}

/**
 * Картка курсу в каталозі `/courses` (за мокапом `mockup-01-courses.html`).
 * Реальний курс (`available: true`) — клікабельна картка-лінк. Курси, яких
 * ще немає в розробці, показуються тим самим макетом, але не клікабельні —
 * з бейджем "Незабаром" замість CTA.
 */
export function CourseCard({ course, className, href = "/lessons" }: CourseCardProps) {
  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden bg-accent-soft">
        <Image
          src={course.coverImage}
          alt=""
          fill
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          className={cn(
            "object-cover transition-transform duration-200",
            course.available && "group-hover:scale-105",
          )}
          unoptimized
        />
        {course.free && (
          <span className="absolute left-3.5 top-3.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold tracking-wide text-accent-dark uppercase">
            Безкоштовно
          </span>
        )}
        <span className="absolute right-3.5 top-3.5 rounded-full bg-ink/65 px-3 py-1.5 text-[11px] text-white">
          {course.level}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <h3 className="font-serif text-[19px] text-ink">{course.title}</h3>
        <p className="flex-1 text-sm leading-relaxed text-muted">{course.description}</p>

        <div className="flex items-center justify-between border-t border-cream-soft pt-3 text-xs text-muted">
          <span>{course.lessonsCount} уроків</span>
          <span className="flex items-center gap-1.5">
            <UsersIcon size={14} />
            <strong className="font-semibold text-ink">
              {course.studentsCount >= 1000
                ? `${Math.floor(course.studentsCount / 1000)}000+`
                : course.studentsCount}
            </strong>{" "}
            учениць
          </span>
        </div>

        {course.available ? (
          <span className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-accent-soft py-2.5 text-sm font-semibold text-accent-dark transition-colors group-hover:bg-accent group-hover:text-white">
            Переглянути курс
            <ArrowRightIcon size={15} />
          </span>
        ) : (
          <span className="mt-1 flex items-center justify-center gap-1.5 rounded-full bg-cream-soft py-2.5 text-sm font-semibold text-muted">
            Незабаром
          </span>
        )}
      </div>
    </>
  );

  const cardClassName = cn(
    "flex flex-col overflow-hidden rounded-[22px] border border-rose-line/50 bg-white transition-shadow",
    course.available && "group hover:-translate-y-1 hover:shadow-lg",
    !course.available && "opacity-70 grayscale-[35%]",
    className,
  );

  if (!course.available) {
    return (
      <div className={cardClassName} aria-disabled="true">
        {body}
      </div>
    );
  }

  return (
    <Link href={href} className={cardClassName}>
      {body}
    </Link>
  );
}
