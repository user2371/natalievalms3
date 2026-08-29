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
import { listLessonsService } from "@/modules/lessons";
import { getFeaturedCourseAction } from "@/modules/siteSettings";

export const dynamic = "force-dynamic";

/**
 * Server Component (задача 3.11) — раніше був `"use client"` лише заради
 * локального `loggedIn`-стану для `<Header>` (з застарілим коментарем
 * "TODO(Фаза 2): user підтягується з сесії замість локального стану" —
 * саме це вже сталось у Фазі 2: `Header` без переданих `user`/`onLogout`
 * сам читає реальну сесію через `useSession()`), тому клієнтський стан тут
 * більше не потрібен.
 *
 * ФАЗА HOME+ (29.08.2026): featured-курс тепер вантажиться ТУТ, на
 * сервері (`getFeaturedCourseAction`, `modules/siteSettings`), замість
 * колишнього клієнтського `useFeaturedCourse`/`localStorage`-вибору
 * (задокументована проблема 0.20.1 — тепер вирішена). Один готовий
 * об'єкт `featuredCourse: Course | null` передається в усі п'ять секцій
 * лендінгу, які його споживають (`HeroSection`/`ProgramSection`/
 * `IntroSection`/`MasterSection`/`CtaBanner`) — секції більше НЕ шукають
 * "свій" курс самі за `slug`.
 *
 * `export const dynamic = "force-dynamic"` — без цього Next.js міг би
 * закешувати/пререндерити головну сторінку один раз при білді, і зміна
 * featured-курсу адміном не з'явилась би на сайті без повного редеплою
 * (той самий прапорець, що вже є на `/courses` і `/admin/courses`).
 *
 * `.catch(() => [])`/`.catch(() => null)` — щоб недоступність БД (напр.
 * без мережі до Prisma engine) не валила рендер усього лендінгу, а
 * просто лишала секції на статичних фолбек-даних, як і до цієї задачі.
 */
export default async function Home() {
  const featuredCourse = await getFeaturedCourseAction().catch(() => null);
  const realLessonsByCourseId = featuredCourse
    ? await listLessonsService(featuredCourse.id)
        .then((lessons) => ({ [featuredCourse.id]: lessons }))
        .catch(() => ({}))
    : {};

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="relative flex-1">
        <DecorativeBackground />
        <HeroSection
          featuredCourse={featuredCourse}
          realLessonsByCourseId={realLessonsByCourseId}
        />
        <AudienceSection />
        <ProgramSection
          featuredCourse={featuredCourse}
          realLessonsByCourseId={realLessonsByCourseId}
        />
        <StepsSection />
        <IntroSection featuredCourse={featuredCourse} />
        <MasterSection featuredCourse={featuredCourse} />
        <TestimonialsSection />
        <CtaBanner
          featuredCourse={featuredCourse}
          realLessonsByCourseId={realLessonsByCourseId}
        />
      </main>

      <Footer />
    </div>
  );
}
