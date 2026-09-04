"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Header } from "@/components/layout/Header";
import { AccountLayout } from "@/components/account/AccountLayout";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { CertificateThumbnail } from "@/components/certificates/CertificateThumbnail";
import { HomeworkVideoCard } from "@/components/profile/HomeworkVideoCard";
import { CourseProgressRow } from "@/components/profile/CourseProgressRow";
import { Button } from "@/components/ui/Button";
import { ProfileHeroSkeleton } from "@/components/skeletons/ProfileHeroSkeleton";
import { Skeleton } from "@/components/ui/Skeleton";
import { CertificateThumbnailSkeleton } from "@/components/skeletons/CertificateThumbnailSkeleton";
import { EditIcon, ArrowRightIcon, ChatIcon } from "@/components/ui/icons";
import { FALLBACK_AVATAR_SRC } from "@/components/ui/Avatar";
import { getPublicProfileAction } from "@/modules/profile/actions";
import { getCertificatesForUserAction } from "@/modules/certificates";
import { startConversationAction } from "@/modules/messages";
import type { PublicProfile } from "@/modules/profile/service";
import type { CertificateEntry } from "@/modules/certificates";

const VISIBLE_CERTIFICATES = 5;

/**
 * Заглушка для великого "фото" в `ProfileHero`, коли в реального юзера
 * немає `avatarUrl` (задача 6.6.18). Оновлено (F.28): був
 * `profileDemoPhoto.jpg` — реальне фото конкретної людини в холодних
 * тонах, що не пасувало до теплої кольорової гами додатку. Замінено на
 * новий мінімалістичний SVG-силует у фірмових кольорах (той самий файл,
 * що й на `/profile`/`/settings`, `app/globals.css`).
 */
const FALLBACK_PROFILE_PHOTO = FALLBACK_AVATAR_SRC;
/** Заглушка для обкладинки курсу в `CourseProgressRow` (вимагає non-null string), коли `Course.coverImage` не задано в адмінці. */
const FALLBACK_COURSE_COVER = "/heroImage.png";

interface UserProfilePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Порожній стан для секцій без даних (задача 0.9.7) — за стилем уже
 * наявного empty state ДЗ на приватному `/profile`.
 */
function ProfileEmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 rounded-2xl border border-dashed border-rose-line/60 py-10 text-center text-sm text-muted">
      {children}
    </p>
  );
}

/**
 * Публічна сторінка профілю `/users/[id]` (задача 0.9.9), доступна без
 * авторизації — клік на аватар під коментарем чи в таблиці рейтингу веде
 * саме сюди. За прямим уточненням від користувача (16.07.2026) вигляд
 * контенту ІДЕНТИЧНИЙ приватному `/profile`, тому тут перевикористані ті
 * самі компоненти (`ProfileHero`, `CertificateThumbnail`,
 * `CourseProgressRow`, `HomeworkVideoCard`) — відрізняється лише каркас
 * навколо них:
 *
 * - якщо `id` === `session.user.id` (реальна сесія) — контент обгортається
 *   в `AccountLayout` (повний кабінет із сайдбаром, як `/profile`);
 * - якщо `id` — БУДЬ-ЯКИЙ інший userId, каркас лише `Header` + контент, без
 *   сайдбару. Невідомий/неіснуючий `userId` → 404.
 *
 * Обидві гілки — ОДНЕ й те саме джерело даних, `getPublicProfileAction`
 * (`modules/profile`, задачі 6.6.16/6.6.17): раніше "власна" гілка мала
 * повністю дубльовану логіку на `DEMO_PROFILE`+`localStorage`
 * (`useLocalProgress`/`useLocalHomework`) — той самий баг, що був на
 * `/profile` (виправлено 02.08.2026), плюс перевірка "це я" робилась через
 * порівняння з хардкодженим `DEMO_PROFILE.id`, а не реальну сесію. Обидва
 * виправлено 02.08.2026 за прямим проханням користувача — тепер єдине
 * джерело правди для ОБОХ гілок, різниця лише в обгортці навколо
 * (`AccountLayout` + кнопка "Редагувати профіль" для власника) і в тому,
 * що власник завжди бачить своє ДЗ незалежно від `homeworkVisible`
 * (перемикач впливає лише на те, що бачать ІНШІ).
 *
 * ⚠️ Сертифікати — окреме джерело, `getCertificatesForUserAction`
 * (`modules/certificates`, Фаза "Fixes", 02.08.2026) — не входять у сам
 * `getPublicProfileAction` (окремий модуль, окремий запит), але так само
 * реальні дані для обох гілок.
 *
 * ⚠️ `homeworkVisible` (для ЧУЖОГО профілю) — реальне поле `User.homeworkVisible`
 * з БД, синхронізоване з перемикачем на `/settings` (задача 9.15).
 */
export default function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const isOwnProfile = status === "authenticated" && session?.user?.id === id;
  const router = useRouter();

  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);
  const [startingConversation, setStartingConversation] = useState(false);
  // MSG+.4.1 (04.09.2026): `startConversationAction` тепер може впасти
  // через блокування (`assertNotBlocked`, `modules/messages/service.ts`)
  // — раніше помилка мовчки ігнорувалась (`result.error` не читався).
  const [startConversationError, setStartConversationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublicProfileAction(id)
      .then((result) => {
        if (cancelled) return;
        setProfile(result.success ? result.profile : null);
      })
      .catch(() => {
        // Раніше без .catch(): якщо запит падав (мережа, помилка серверного
        // рендеру відповіді тощо), .then() ніколи не викликався, і
        // `profile` навічно лишався `undefined` — сторінка застрягала на
        // скелетоні без жодного індикатора помилки. Тепер падіння запиту
        // трактується так само, як "профіль не знайдено" (нижче — `notFound()`).
        if (!cancelled) setProfile(null);
      });
    getCertificatesForUserAction(id)
      .then((result) => {
        if (!cancelled && result.success) {
          setCertificates(result.certificates);
        }
      })
      .catch(() => {
        // Сертифікати — другорядні дані; якщо запит падає, просто лишаємо
        // порожній список замість того, щоб мовчки ковтати необроблений reject.
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (profile === undefined) {
    // ФАЗА SKELETON, задача SKEL.6.1: раніше — порожній `<div />`
    // (мовчазна пауза без жодного натяку на форму майбутнього контенту).
    // На цьому етапі ще невідомо, чи це власний профіль, чи чужий (це
    // з'ясовується лише ПІСЛЯ відповіді `getPublicProfileAction`, разом
    // із самими даними), тому скелетон навмисно НЕ обгортається в
    // `AccountLayout` — той самий нейтральний каркас `Header` + контент,
    // що й гілка "чужого профілю" нижче, підходить для обох випадків
    // без "стрибка" сайдбару, який міг би з'явитись/зникнути одразу
    // після завантаження.
    return (
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 py-8 pb-16 sm:py-10">
          <div className="mx-auto max-w-5xl px-6">
            <Skeleton className="h-8 w-56" />
            <ProfileHeroSkeleton className="mt-6" />
            <div className="mt-10">
              <Skeleton className="h-6 w-32" />
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <CertificateThumbnailSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (profile === null) {
    notFound();
  }

  /**
   * MSG+.3.3 (03.09.2026): кнопка "Написати повідомлення" на чужому
   * профілі — `startConversationAction` (`modules/messages`, вже готовий з
   * MSG+.1) знаходить наявну розмову з цим користувачем АБО створює нову,
   * повертає лише `conversationId` — і одразу перехід на сам екран
   * розмови (MSG+.3.2), яка сама довантажить історію.
   */
  async function handleStartConversation() {
    if (startingConversation) return;
    setStartingConversation(true);
    setStartConversationError(null);
    try {
      const result = await startConversationAction({ recipientId: id });
      if (result.success && result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      } else {
        setStartConversationError(result.error);
      }
    } finally {
      setStartingConversation(false);
    }
  }

  // Власник завжди бачить своє ДЗ, незалежно від `homeworkVisible` —
  // перемикач впливає лише на те, що бачать ІНШІ (задача 9.15).
  const showHomework = isOwnProfile || profile.homeworkVisible;

  const heroSection = (
    <ProfileHero
      name={profile.name}
      handle={profile.handle}
      photoUrl={profile.avatarUrl ?? FALLBACK_PROFILE_PHOTO}
      bio={profile.bio ?? ""}
      joinedAt={profile.joinedAt}
      points={profile.points}
      rank={profile.rank}
      rankOutOf={profile.rankOutOf}
      className="mt-6"
    />
  );

  const certificatesSection = (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-ink">Сертифікати</h2>
        {certificates.length > VISIBLE_CERTIFICATES && (
          <Link href={`/users/${id}/certificates`}>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRightIcon size={14} />}
              iconPosition="right"
            >
              Показати всі ({certificates.length})
            </Button>
          </Link>
        )}
      </div>

      {certificates.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
          {certificates.slice(0, VISIBLE_CERTIFICATES).map((certificate) => (
            <CertificateThumbnail
              key={certificate.id}
              certificate={certificate}
              holderName={profile.name}
            />
          ))}
        </div>
      ) : (
        <ProfileEmptyState>
          {isOwnProfile
            ? "Ще немає жодного отриманого сертифіката. Заверши курс, щоб отримати перший."
            : `${profile.name.split(" ")[0]} ще не отримала жодного сертифіката.`}
        </ProfileEmptyState>
      )}
    </section>
  );

  const homeworkSection = showHomework && (
    <section id="homework" className="mt-10 scroll-mt-24">
      <h2 className="font-serif text-xl text-ink">Домашні завдання</h2>
      {profile.homeworkVideos.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {profile.homeworkVideos.map((item, index) => (
            <HomeworkVideoCard
              key={`${profile.id}-hw-${index}`}
              courseName={item.courseName}
              lessonNumber={item.lessonNumber}
              lessonTitle={item.lessonTitle}
              submittedAt={item.submittedAt}
              videoId={item.videoId}
            />
          ))}
        </div>
      ) : (
        <ProfileEmptyState>
          {isOwnProfile
            ? "Ще немає зданих відео ДЗ. Здай перше домашнє завдання на сторінці будь-якого уроку — і воно одразу зʼявиться тут."
            : `${profile.name.split(" ")[0]} ще не здала жодного відео ДЗ.`}
        </ProfileEmptyState>
      )}
    </section>
  );

  const coursesSection = (
    <section className="mt-10">
      <h2 className="font-serif text-xl text-ink">Пройдені курси</h2>
      {profile.completedCourses.length > 0 ? (
        <div className="mt-3 divide-y divide-cream-soft">
          {profile.completedCourses.map((course, index) => (
            <CourseProgressRow
              key={`${profile.id}-course-${index}`}
              title={course.title}
              coverImage={course.coverImage ?? FALLBACK_COURSE_COVER}
              completedLessons={course.completedLessons}
              totalLessons={course.totalLessons}
            />
          ))}
        </div>
      ) : (
        <ProfileEmptyState>
          {isOwnProfile
            ? "Ще немає пройдених курсів. Почни з першого уроку в каталозі — прогрес зʼявиться тут."
            : `${profile.name.split(" ")[0]} ще не проходила жодного курсу.`}
        </ProfileEmptyState>
      )}
    </section>
  );

  if (isOwnProfile) {
    return (
      <AccountLayout user={{ name: profile.name, avatarUrl: profile.avatarUrl }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-3xl text-ink sm:text-4xl">Мій профіль</h1>
          {/* Кнопка "Редагувати профіль" — видима тільки власнику (0.9.6) */}
          <Link href="/settings">
            <Button
              variant="outline"
              size="sm"
              icon={<EditIcon size={16} />}
              iconPosition="left"
            >
              Редагувати профіль
            </Button>
          </Link>
        </div>

        {heroSection}
        {certificatesSection}
        {homeworkSection}
        {coursesSection}
      </AccountLayout>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1 py-8 pb-16 sm:py-10">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-serif text-3xl text-ink sm:text-4xl">Профіль майстрині</h1>
            {/* MSG+.3.3: видима лише залогіненому відвідувачу — на чужому неавторизованому перегляді (гість) писати нікому немає сенсу, `startConversationAction` все одно вимагає сесію. */}
            {status === "authenticated" && (
              <div className="flex flex-col items-end gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ChatIcon size={16} />}
                  iconPosition="left"
                  loading={startingConversation}
                  onClick={handleStartConversation}
                >
                  Написати повідомлення
                </Button>
                {startConversationError && (
                  <p className="text-xs text-danger">{startConversationError}</p>
                )}
              </div>
            )}
          </div>

          {heroSection}
          {certificatesSection}
          {homeworkSection}
          {coursesSection}
        </div>
      </main>
    </div>
  );
}
