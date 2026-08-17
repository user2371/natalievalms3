"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AccountLayout } from "@/components/account/AccountLayout";
import { GuestGate } from "@/components/account/GuestGate";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { CertificateThumbnail } from "@/components/certificates/CertificateThumbnail";
import { HomeworkVideoCard } from "@/components/profile/HomeworkVideoCard";
import { CourseProgressRow } from "@/components/profile/CourseProgressRow";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { getPublicProfileAction } from "@/modules/profile/actions";
import { getCertificatesForUserAction } from "@/modules/certificates";
import type { PublicProfile } from "@/modules/profile/service";
import type { CertificateEntry } from "@/modules/certificates";

const VISIBLE_CERTIFICATES = 5;
/** Заглушка для великого "фото" в `ProfileHero`, коли в реального юзера немає `avatarUrl` (той самий підхід, що вже на `/users/[id]`, задача 6.6.18). */
const FALLBACK_PROFILE_PHOTO = "/profileDemoPhoto.jpg";
/** Заглушка для обкладинки курсу (той самий підхід, що на `/users/[id]`), коли в `Course.coverImage` нічого не задано в адмінці. */
const FALLBACK_COURSE_COVER = "/heroImage.png";

/**
 * Сторінка "Мій профіль" (`/profile`), за мокапом `ProfilePage.png`. Бали/
 * рейтинг, здані відео ДЗ і "Пройдені курси" — усе РЕАЛЬНЕ, з БД
 * (`getPublicProfileAction`, той самий сервіс, що вже живить публічний
 * `/users/[id]`): замість фото тут одразу вбудований YouTube-плеєр для
 * кожного зданого відео.
 *
 * 19.07.2026, сесія 15, за прямим проханням користувача: секцію
 * "Досягнення" замінено на "Сертифікати" — `CertificateThumbnail`, до 5
 * мініатюр (`VISIBLE_CERTIFICATES`), кнопка "Показати всі" (лише коли
 * сертифікатів більше 5) веде на `/certificates`.
 *
 * 29.07.2026, задача 6.6.15, за прямим проханням користувача:
 * `AchievementBadge`/`DEMO_ACHIEVEMENTS` (тоді ще не видалені "про запас")
 * ПОВНІСТЮ ВИДАЛЕНО з проєкту разом із Prisma-моделями
 * `Achievement`/`UserAchievement` (`modules/achievements`) — на профілі
 * остаточно лишаються тільки Сертифікати.
 *
 * 19.07.2026, сесія 17, за прямим проханням користувача: сторінка більше
 * не доступна незалогіненому відвідувачу — `!loggedIn` рендерить
 * `<GuestGate />` замість `AccountLayout`+контенту (той самий демо-тогл
 * `loggedIn`, що й раніше; за замовчуванням `true`, стає `false` після
 * "Вийти" в сайдбарі — раніше цей клік нічого фактично не приховував).
 *
 * 23.07.2026, Фаза 2, задача 2.18: гейт замінено з локального демо-тоглу
 * `loggedIn` на реальну сесію Auth.js (`useSession`). Захист тепер
 * дворівневий — той самий принцип "не тільки в UI", що вже задокументований
 * для `/admin/*`: `middleware.ts` редіректить незалогіненого відвідувача на
 * `/` (з відкриттям `AuthModal`) ще ДО рендеру сторінки, а цей клієнтський
 * check лишається як другий рівень захисту.
 *
 * 02.08.2026, виправлення за прямим зверненням користувача ("бачу Марію
 * Шевченко замість свого імені на /profile, хоча в хедері правильно"):
 * ім'я/аватар/біо/дата реєстрації/бали/рейтинг і далі бралися з
 * `DEMO_PROFILE` — той самий гейт на реальну сесію (задача 2.18) захищав
 * ДОСТУП до сторінки, але сам КОНТЕНТ так і лишився демо-заглушкою.
 * Тепер — `getPublicProfileAction(session.user.id)` (той самий сервіс, що
 * вже живить публічний `/users/[id]`, задача 6.6.17): ім'я/аватар з
 * `session.user` доступні одразу (синхронно, без миготіння — той самий
 * принцип, чому в хедері вони й раніше були коректні), решта полів (біо,
 * дата, бали, рейтинг) — після короткого `useEffect`-запиту. "Домашні
 * завдання"/"Пройдені курси" нижче на той момент і далі лишалися на
 * `localStorage` (`useLocalProgress`/`useLocalHomework`) — окрема, більша
 * розбіжність, виправлена пізніше (04.08.2026, див. нижче).
 *
 * 02.08.2026, Фаза "Fixes", за прямим проханням користувача: секція
 * "Сертифікати" тепер теж на реальних даних — `getCertificatesForUserAction`
 * (`modules/certificates`, новий модуль) замість `DEMO_CERTIFICATES`.
 *
 * 04.08.2026, Фаза "Fixes", за прямим зверненням користувача ("на сторінці
 * профілю відображаються некоректні домашні завдання"): секція "Мої
 * домашні завдання" ТЕЖ переведена на реальні дані — `profile.homeworkVideos`
 * з того самого вже завантаженого `getPublicProfileAction`
 * (`repository.findHomeworkSubmissionsForUser`), замість
 * `useLocalHomework()` (`localStorage`) + `LESSONS` (`lib/data/lessons.ts`,
 * статичний демо-курс). Причина розбіжності: реальна здача ДЗ
 * (`RealHomeworkBlock` на `/courses/[slug]/lessons/[lessonId]`) вже давно
 * пише напряму в Prisma (`submitHomeworkAction`, задача 9.15) і ключується
 * реальним `lessonId`, а ця секція й далі читала стару `localStorage`-копію,
 * ключовану `lessonSlug` статичного датасету — тож показувала або порожньо,
 * або застарілі значення з попередніх ручних тестів легасі
 * `/lessons/[slug]`-флоу, ніяк не повʼязані з реально зданими відео
 * користувача. Той самий `getPublicProfileAction`, що вже коректно живить
 * `/users/[id]` (задача 6.6.17) — тепер обидві сторінки показують
 * ІДЕНТИЧНИЙ список ДЗ для того самого користувача.
 *
 * 04.08.2026, за прямим зверненням користувача ("некоректна інформація про
 * пройдені курси" — показувало 0 уроків замість реального прогресу):
 * секцію "Пройдені курси" ТЕЖ переведено на `profile.completedCourses`
 * (той самий уже завантажений `getPublicProfileAction`) замість
 * захардкодженого `COURSES[0]` + `completedSlugs.size` з
 * `useLocalProgress()` (`lib/progress/*`, статичний демо-курс і
 * `localStorage`-прогрес, не пов'язані з реальними курсами користувача в
 * БД). Тепер `/profile` і `/users/[id]` показують ІДЕНТИЧНИЙ реальний
 * список пройдених курсів для того самого користувача.
 */
export default function ProfilePage() {
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const userId = session?.user?.id;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [certificates, setCertificates] = useState<CertificateEntry[]>([]);

  // Ім'я/аватар доступні одразу з `session.user` (той самий об'єкт, що вже
  // коректно показує їх у хедері) — решта (біо/дата/бали/рейтинг) лише тут,
  // на `/users/[id]`/`getPublicProfileService`, тож підвантажуємо окремо.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    getPublicProfileAction(userId).then((result) => {
      if (!cancelled && result.success) {
        setProfile(result.profile);
      }
    });
    getCertificatesForUserAction(userId).then((result) => {
      if (!cancelled && result.success) {
        setCertificates(result.certificates);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const displayName = session?.user?.name ?? profile?.name ?? "";
  const avatarUrl =
    (session?.user as { avatarUrl?: string } | undefined)?.avatarUrl ??
    profile?.avatarUrl ??
    null;

  const homeworkVideos = profile?.homeworkVideos ?? [];
  const completedCourses = profile?.completedCourses ?? [];

  if (status === "loading") {
    return null;
  }

  if (!loggedIn) {
    return <GuestGate description="профілю" />;
  }

  return (
    <AccountLayout user={loggedIn ? { name: displayName, avatarUrl } : null}>
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">Мій профіль</h1>

      <ProfileHero
        name={displayName}
        handle={profile?.handle ?? ""}
        photoUrl={avatarUrl ?? FALLBACK_PROFILE_PHOTO}
        bio={profile?.bio ?? ""}
        joinedAt={profile?.joinedAt ?? new Date().toISOString()}
        points={profile?.points ?? 0}
        rank={profile?.rank ?? 0}
        rankOutOf={profile?.rankOutOf ?? 0}
        className="mt-6"
      />

      {/* Сертифікати (задача 0.16) — до 5 мініатюр, кнопка "Показати всі", якщо їх більше */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-xl text-ink">Сертифікати</h2>
          {certificates.length > VISIBLE_CERTIFICATES && (
            <Link href="/certificates">
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
                holderName={displayName}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-rose-line/60 py-10 text-center text-sm text-muted">
            Ще немає жодного отриманого сертифіката. Заверши курс, щоб отримати перший.
          </p>
        )}
      </section>

      {/* Мої домашні завдання — реальні здані відео замість фото */}
      <section id="homework" className="mt-10 scroll-mt-24">
        <h2 className="font-serif text-xl text-ink">Мої домашні завдання</h2>

        {homeworkVideos.length > 0 ? (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {homeworkVideos.map((item, index) => (
              <HomeworkVideoCard
                key={`${profile?.id ?? "me"}-hw-${index}`}
                courseName={item.courseName}
                lessonNumber={item.lessonNumber}
                lessonTitle={item.lessonTitle}
                submittedAt={item.submittedAt}
                videoId={item.videoId}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-rose-line/60 py-10 text-center text-sm text-muted">
            Ще немає зданих відео ДЗ. Здай перше домашнє завдання на сторінці будь-якого
            уроку — і воно одразу зʼявиться тут.
          </p>
        )}
      </section>

      {/* Пройдені курси — реальний прогрес із БД (той самий `getPublicProfileAction`,
          що вже коректно живить цю секцію на `/users/[id]`; тут раніше лишався
          старий демо-курс + `localStorage`-прогрес, не пов'язаний із реальними
          курсами користувача — виправлено за прямим зверненням користувача). */}
      <section className="mt-10">
        <h2 className="font-serif text-xl text-ink">Пройдені курси</h2>
        {completedCourses.length > 0 ? (
          <div className="mt-3 divide-y divide-cream-soft">
            {completedCourses.map((course, index) => (
              <CourseProgressRow
                key={`${profile?.id ?? "me"}-course-${index}`}
                title={course.title}
                coverImage={course.coverImage ?? FALLBACK_COURSE_COVER}
                completedLessons={course.completedLessons}
                totalLessons={course.totalLessons}
              />
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-rose-line/60 py-10 text-center text-sm text-muted">
            Ще немає пройдених курсів. Почни з першого уроку в каталозі — прогрес
            зʼявиться тут.
          </p>
        )}
      </section>
    </AccountLayout>
  );
}
