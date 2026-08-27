import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/landing/Footer";
import { Skeleton } from "@/components/ui/Skeleton";
import { LessonCardSkeleton } from "@/components/skeletons/LessonCardSkeleton";

/**
 * Скелетон `/courses/[slug]` (ФАЗА SKELETON, задача SKEL.5) — hero-блок
 * (бейдж/заголовок/опис/кнопка зліва, обкладинка `aspect-video` справа,
 * та сама сітка `lg:grid-cols-[1.1fr_0.9fr]`, що й реальна сторінка) +
 * сітка `LessonCardSkeleton` для "Програми курсу". Кількість
 * карток-заглушок (6) — приблизна "типова" програма курсу; коли уроків
 * реально менше, зайві просто зникають разом зі скелетоном після
 * завантаження (Next підміняє `loading.tsx` контентом одразу, як тільки
 * `getCourseBySlugService`/`listLessonsService` резолвляться).
 */
export default function CourseDetailLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-5xl px-6">
          <Skeleton className="h-4 w-24" />

          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-9 w-full max-w-md" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="mt-3 h-11 w-44 rounded-full" />
            </div>
            <Skeleton className="aspect-video w-full rounded-2xl" />
          </div>

          <div className="mt-14">
            <Skeleton className="h-8 w-56" />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <LessonCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
