import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeftIcon, PlayIcon, SparkleIcon } from "@/components/ui/icons";
import { RealLessonCard } from "@/components/lesson/RealLessonCard";
import { CourseContinueButton } from "@/components/course/CourseContinueButton";
import { PaywallNotice } from "@/components/course/PaywallNotice";
import { getCourseBySlugService } from "@/modules/courses";
import { listLessonsService } from "@/modules/lessons";
import { hasCourseAccessService } from "@/modules/access";

interface CoursePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * SEO-метадані (задача 3.22). Неопублікований курс навмисно НЕ повторює
 * повну перевірку ролі з тіла компонента нижче — `generateMetadata`
 * виконується окремо від рендеру сторінки, а видача заголовка/опису
 * неопублікованого курсу в `<head>` (навіть без самого контенту на
 * сторінці) не є витоком чогось чутливого; тому тут просто нейтральний
 * фолбек-заголовок, якщо курс не знайдено, без дублювання `auth()`-виклику.
 */
export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlugService(slug).catch(() => null);

  if (!course) {
    return { title: "Курс не знайдено" };
  }

  return {
    title: course.title,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: course.coverImage ? [{ url: course.coverImage }] : undefined,
    },
  };
}

/**
 * `/courses/[slug]` (задача 3.14) — лендінг РЕАЛЬНОГО (Prisma) курсу. На
 * відміну від головної сторінки (`app/page.tsx`), тут немає адмінського
 * "featured"-вибору — курс береться напряму за `slug` з URL, без "містячи"
 * зі статичним каталогом `lib/data/courses.ts`.
 *
 * Немає власного мокапу для цієї сторінки (на відміну від решти проєкту,
 * де мокапи — pixel-accurate джерело правди) — дизайн зібраний з наявних
 * UI-примітивів (`Badge`, іконки), узгоджено зі стилем решти лендінгу.
 *
 * 404, якщо курсу з таким `slug` не існує (задача 3.17 — повна обробка
 * "курс не опубліковано" для не-адмінів — окрема задача 3.18, тут поки
 * НЕ перевіряється `published`).
 */
export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;

  const course = await getCourseBySlugService(slug).catch(() => null);
  if (!course) {
    notFound();
  }

  // Задача 3.18: неопублікований курс (`published: false`) — 404 для
  // будь-кого, крім ADMIN (той самий принцип "не тільки в UI", що й у
  // мідлварі/server actions — перевірка ролі саме тут, на рівні сторінки,
  // а не залишена на відкуп UI-станам типу "прихованого лінка").
  //
  // ФАЗА PAID+, задача PAID+.3.1 (02.09.2026) — сесія тепер читається
  // тут один раз (раніше — лише всередині `if (!course.published)`),
  // бо потрібна і для перевірки `published`, і для гейта платного курсу
  // нижче (`hasCourseAccessService`).
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!course.published && role !== "ADMIN") {
    notFound();
  }

  const lessons = await listLessonsService(course.id).catch(() => []);

  // ФАЗА PAID+, задача PAID+.3.1 — платний курс без доступу: лендінг
  // лишається видимим (опис/трейлер/програма — задача PAID+.3.1,
  // "курс НЕ приховується з каталогу/лендінгу через `isPaid`"), лише
  // кнопка "Почати навчання" заміняється на `PaywallNotice`.
  const hasAccess = await hasCourseAccessService(
    { id: course.id, isPaid: course.isPaid },
    session?.user?.id ? { id: session.user.id, role } : undefined,
  );

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-6">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent-dark"
          >
            <ArrowLeftIcon size={16} />
            Усі курси
          </Link>

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge icon={<SparkleIcon size={14} />}>Курс</Badge>
              <h1 className="mt-4 font-serif text-3xl leading-tight text-ink sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-4 text-base text-muted sm:text-lg">{course.description}</p>

              {/* ФАЗА PAID+, задача PAID+.3.1 — платний курс без доступу:
                  `PaywallNotice` замість кнопки "Почати навчання", той
                  самий блок і для гостя (`requiresAuth`), і для
                  залогіненого без покупки (жоден `CoursePurchase` ще не
                  може існувати до ФАЗИ PAID+.4). */}
              {course.isPaid && !hasAccess ? (
                <PaywallNotice
                  priceUAH={course.priceUAH}
                  requiresAuth={!session?.user?.id}
                  courseId={course.id}
                />
              ) : (
                lessons.length > 0 && (
                  <CourseContinueButton
                    courseId={course.id}
                    courseSlug={course.slug}
                    lessons={lessons}
                    className="mt-7 inline-block"
                  />
                )
              )}
            </div>

            {course.coverImage && (
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink">
                <Image
                  src={course.coverImage}
                  alt={course.title}
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                  // Локальні `/public`-зображення (як у seed-даних) Next
                  // оптимізує нативно. `coverImage` водночас може бути
                  // будь-яким зовнішнім URL, який задав адмін
                  // (`CreateCourseSchema`: `coverImage: z.string().url()`)
                  // — його хост не гарантовано є в `images.remotePatterns`
                  // (`next.config.ts`), тому для зовнішніх URL лишаємо
                  // `unoptimized`, щоб довільний хост не ламав сторінку
                  // (задача 3.20, той самий баг, що виправляли для аватарів).
                  unoptimized={course.coverImage.startsWith("http")}
                />
              </div>
            )}
          </div>

          <div className="mt-14">
            <h2 className="font-serif text-2xl text-ink sm:text-3xl">
              Програма курсу{" "}
              <Badge className="border bg-transparent">{lessons.length} уроків</Badge>
            </h2>

            {lessons.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-rose-line/60 px-6 py-14 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
                  <PlayIcon size={20} />
                </span>
                <div>
                  <p className="font-serif text-lg text-ink">Уроки курсу ще додаються</p>
                  <p className="mt-1 max-w-sm text-sm text-muted">
                    Програма цього курсу поки порожня. Зазирни трохи пізніше — перші уроки
                    з&apos;являться тут.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {lessons.map((lesson) => (
                  <RealLessonCard
                    key={lesson.id}
                    lesson={lesson}
                    courseSlug={course.slug}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
