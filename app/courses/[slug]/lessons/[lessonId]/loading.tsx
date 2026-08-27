import { Header } from "@/components/layout/Header";
import { Skeleton } from "@/components/ui/Skeleton";
import { LessonCardSkeleton } from "@/components/skeletons/LessonCardSkeleton";

/**
 * Скелетон `/courses/[slug]/lessons/[lessonId]` (ФАЗА SKELETON, задача
 * SKEL.5) — найважча за кількістю блоків сторінка (відео, ДЗ, квіз,
 * коментарі), тому скелетон повторює лише "каркас вище згину" (`order-1`/
 * `order-2` та сама сітка `lg:grid-cols-[320px_1fr]`, що й
 * `CourseLessonSidebar` + відео): 4 `LessonCardSkeleton` замість сайдбару
 * уроків і великий `aspect-video`-блок замість `VideoPlayer` — саме ці
 * два елементи видно одразу при відкритті уроку, без скролу. Блоки
 * нижче (ДЗ/квіз/коментарі) навмисно НЕ дублюються тут — вони й так поза
 * першим екраном, а Next підмінює цей `loading.tsx` реальним контентом
 * одразу, як тільки `getLessonBySlugService`/`listLessonsService`
 * резолвляться (без помітного "стрибка" скелетон → контент нижче згину).
 */
export default function CourseLessonLoading() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 lg:grid-cols-[320px_1fr]">
          <div className="order-2 flex flex-col gap-2 lg:order-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <LessonCardSkeleton key={i} />
            ))}
          </div>

          <div className="order-1 lg:order-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-8 w-full max-w-md" />
            <Skeleton className="mt-6 aspect-video w-full rounded-2xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
