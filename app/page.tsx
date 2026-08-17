import { Header } from "@/components/layout/Header";
import { DecorativeBackground } from "@/components/landing/DecorativeBackground";
import { HeroSection } from "@/components/landing/HeroSection";
import { AudienceSection } from "@/components/landing/AudienceSection";
import { ProgramSection } from "@/components/landing/ProgramSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { IntroSection } from "@/components/landing/IntroSection";
import { MasterSection } from "@/components/landing/MasterSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CtaBanner } from "@/components/landing/CtaBanner";
import { Footer } from "@/components/landing/Footer";
import { listCoursesService } from "@/modules/courses";
import { listLessonsService } from "@/modules/lessons";

/**
 * Server Component (задача 3.11) — раніше був `"use client"` лише заради
 * локального `loggedIn`-стану для `<Header>` (з застарілим коментарем
 * "TODO(Фаза 2): user підтягується з сесії замість локального стану" —
 * саме це вже сталось у Фазі 2: `Header` без переданих `user`/`onLogout`
 * сам читає реальну сесію через `useSession()`), тому клієнтський стан тут
 * більше не потрібен.
 *
 * Це відкрило можливість завантажити реальні курси з БД
 * (`listCoursesService` з `modules/courses`) прямо тут, на сервері, і
 * передати в `<HeroSection>` пропом — `useFeaturedCourse` (клієнтський,
 * `localStorage`-вибір адміна) і реальні DB-курси лишаються двома окремими
 * джерелами (задокументована проблема 0.20.1), Hero лише "містить" їх за
 * `slug`, коли можливо (деталі — в `HeroSection.tsx`).
 *
 * `.catch(() => [])` — щоб недоступність БД (напр. без мережі до Prisma
 * engine) не валила рендер усього лендінгу, а просто лишала Hero на
 * статичних даних, як і до цієї задачі.
 */
export default async function Home() {
  const realCourses = await listCoursesService(true).catch(() => []);
  const realLessonsByCourseId = await Promise.all(
    realCourses.map(
      async (course) => [course.id, await listLessonsService(course.id)] as const,
    ),
  )
    .then((entries) => Object.fromEntries(entries))
    .catch(() => ({}));

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="relative flex-1">
        <DecorativeBackground />
        <HeroSection
          realCourses={realCourses}
          realLessonsByCourseId={realLessonsByCourseId}
        />
        <AudienceSection />
        <ProgramSection
          realCourses={realCourses}
          realLessonsByCourseId={realLessonsByCourseId}
        />
        <StepsSection />
        <IntroSection />
        <MasterSection realCourses={realCourses} />
        <TestimonialsSection />
        <CtaBanner
          realCourses={realCourses}
          realLessonsByCourseId={realLessonsByCourseId}
        />
      </main>

      <Footer />
    </div>
  );
}
