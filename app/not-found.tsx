"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  GridIcon,
  BookIcon,
  PlayIcon,
  EditIcon,
  HeadphonesIcon,
  HeartIcon,
} from "@/components/ui/icons";
import { DEMO_PROFILE } from "@/lib/data/profile";
import { COURSES } from "@/lib/data/courses";

const LOOKING_FOR_CARDS = [
  {
    icon: BookIcon,
    title: "All Courses",
    description: "Explore all lessons and master new skills",
    href: "/courses",
  },
  {
    icon: PlayIcon,
    title: "My Lessons",
    description: "Continue learning from where you left off",
    href: "/lessons",
  },
  {
    icon: EditIcon,
    title: "Blog",
    description: "Read useful articles and tips",
    href: null,
  },
  {
    icon: HeadphonesIcon,
    title: "Contact Support",
    description: "We're here to help you anytime",
    href: null,
  },
];

/**
 * Декоративна ізометрична "сцена на столі" праворуч від тексту 404 —
 * ноутбук з відео уроку, нотатник "Today", розгорнута книга, флакон лаку,
 * UV-лампа та ваза з квітами, за мокапом `404Page.png` (задача 0.12.3).
 *
 * 18.07.2026 (сесія 10): користувач напряму вказав, що сторінка "дуже
 * відрізняється" від мокапу — попередня версія (сесія 8) свідомо спрощувала
 * цю сцену до одного квадратного фото інструментів + розмитих плям
 * (задокументовано в `IMPLEMENTATION_STATUS.md` 0.12.3 як "спрощення").
 * Тепер замість фото — композиція з окремих шарів у вже наявній
 * дизайн-мові проєкту (та сама плоска лінійна/заливна стилістика, що й
 * решта UI, без фотореалізму, якого тут все одно не досягти CSS/SVG-
 * шарами) — ноутбук, нотатник, книга, флакон, лампа й квіти розставлені
 * приблизно так само, як на мокапі, замість одного фото-квадрата.
 * Мініатюра всередині розгорнутої книги — те саме фото інструментів, що
 * використовувалось раніше (обкладинка курсу "Матеріали та інструменти
 * профі", `COURSES`), тепер лише як маленька вставка, а не вся ілюстрація.
 */
function Hero404Illustration({ toolsPhoto }: { toolsPhoto?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-md" style={{ aspectRatio: "7 / 5.4" }}>
      {/* Фонові плями, пунктирне кільце й діагональний "мазок" — у стилі
          вже наявного DecorativeBackground.tsx (розмиті плями blur-3xl +
          лінійний SVG-штрих), за рожевими розводами навколо сцени в
          мокапі. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-6 -right-6 h-48 w-48 rounded-full bg-accent-soft/50 blur-3xl sm:h-60 sm:w-60" />
        <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-rose-line/40 blur-3xl sm:h-60 sm:w-60" />
        <svg
          className="absolute left-[4%] top-[6%] h-[68%] w-[68%] text-rose-line/40"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle
            cx="100"
            cy="100"
            r="92"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="1 6"
          />
        </svg>
        <svg
          className="absolute -right-6 -top-6 h-32 w-44 text-rose-line/60 sm:h-40 sm:w-56"
          viewBox="0 0 220 160"
          fill="none"
        >
          <path
            d="M10 130 Q70 40 140 70 T210 10"
            stroke="currentColor"
            strokeWidth="24"
            strokeLinecap="round"
            opacity="0.45"
          />
        </svg>
      </div>

      {/* Дрібні плаваючі декоративні елементи (кулька, кристал) */}
      <span
        aria-hidden
        className="absolute left-[4%] top-0 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-[#dcb98c] to-[#b48c5c] shadow-sm sm:h-4 sm:w-4"
      />
      <span
        aria-hidden
        className="absolute left-[8%] top-[38%] h-3 w-3 rotate-45 rounded-[3px] border border-accent/50 bg-accent-soft/50 sm:h-3.5 sm:w-3.5"
      />

      {/* Ваза з квітами — верхній правий кут */}
      <div
        aria-hidden
        className="absolute right-[4%] top-0 flex w-[15%] flex-col items-center sm:w-[13%]"
      >
        <div className="relative flex h-9 w-9 items-end justify-center gap-0.5 sm:h-11 sm:w-11">
          <span className="h-3 w-3 rounded-full bg-accent-soft sm:h-4 sm:w-4" />
          <span className="h-4 w-4 rounded-full bg-accent/70 sm:h-5 sm:w-5" />
          <span className="h-3 w-3 rounded-full bg-accent-soft sm:h-4 sm:w-4" />
        </div>
        <span className="h-4 w-3.5 rounded-b-lg rounded-t-sm border border-rose-line/50 bg-cream-soft sm:h-5 sm:w-4" />
      </div>

      {/* Нотатник "Today" — над ноутбуком зліва, злегка нахилений */}
      <div
        aria-hidden
        className="absolute left-[-2%] top-[4%] w-[32%] -rotate-6 rounded-lg border border-rose-line/50 bg-cream-soft/95 px-2 py-2 text-center shadow-sm sm:w-[30%] sm:px-2.5"
      >
        <div className="mx-auto mb-1 flex w-1/2 justify-between">
          <span className="h-1 w-1 rounded-full bg-rose-line" />
          <span className="h-1 w-1 rounded-full bg-rose-line" />
          <span className="h-1 w-1 rounded-full bg-rose-line" />
        </div>
        <p className="text-[6px] uppercase tracking-[0.15em] text-muted sm:text-[7px]">
          Today
        </p>
        <p className="mt-1 font-serif text-[8px] italic leading-tight text-accent-dark sm:text-[10px]">
          Invest in your skills and grow
        </p>
        <HeartIcon size={8} className="mx-auto mt-1 text-accent" />
      </div>

      {/* Ноутбук з відео уроку — центральний елемент сцени */}
      <div className="absolute left-[18%] top-[6%] w-[62%] sm:left-[19%]">
        <div
          className="relative overflow-hidden rounded-t-xl border-[3px] border-ink/85 bg-ink shadow-lg"
          style={{ aspectRatio: "16 / 10" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink/95 to-[#3a2e28]" />
          <div className="relative flex h-full flex-col justify-between p-2 sm:p-2.5">
            <div className="flex items-center justify-between">
              <span className="font-serif text-[6px] tracking-[0.2em] text-white/70 sm:text-[8px]">
                NATALIEVA
              </span>
              <span className="flex gap-[3px]">
                <span className="h-[3px] w-[3px] rounded-full bg-white/30" />
                <span className="h-[3px] w-[3px] rounded-full bg-white/30" />
              </span>
            </div>

            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0">
                <span className="inline-block rounded-full bg-white/15 px-1.5 py-0.5 text-[5px] font-medium tracking-wide text-white/80 sm:text-[7px]">
                  УРОК 3
                </span>
                <p className="mt-1 font-serif text-[7px] leading-tight text-white sm:text-[10px]">
                  Покриття гель-лаком
                  <br />
                  під кутикулу
                </p>
              </div>
              <div className="hidden w-9 shrink-0 flex-col gap-1 sm:flex">
                <span className="h-[3px] w-full rounded-full bg-white/25" />
                <span className="h-[3px] w-7 rounded-full bg-white/15" />
                <span className="h-[3px] w-full rounded-full bg-white/15" />
              </div>
            </div>

            <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-white/95 shadow sm:h-8 sm:w-8">
              <PlayIcon size={11} className="translate-x-[1px] text-accent-dark" />
            </span>

            <div className="h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full w-[35%] rounded-full bg-accent" />
            </div>
          </div>
        </div>
        <div
          className="mx-auto h-2 w-[92%] bg-gradient-to-b from-[#d8d3ce] to-[#b9b2ab] sm:h-2.5"
          style={{ clipPath: "polygon(4% 0, 96% 0, 100% 100%, 0% 100%)" }}
        />
      </div>

      {/* Розгорнута книга — нижній лівий кут, під ноутбуком */}
      <div className="absolute bottom-0 left-[-4%] w-[46%] sm:w-[42%]">
        <div className="flex h-14 sm:h-[4.5rem]">
          <div className="flex-1 rounded-l-lg border border-r-0 border-rose-line/40 bg-cream-soft/90 p-1.5 sm:p-2">
            {toolsPhoto && (
              <div className="h-6 w-full overflow-hidden rounded sm:h-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={toolsPhoto} alt="" className="h-full w-full object-cover" />
              </div>
            )}
            <div className="mt-1 space-y-0.5">
              <span className="block h-[2px] w-full rounded bg-ink/10" />
              <span className="block h-[2px] w-4/5 rounded bg-ink/10" />
            </div>
          </div>
          <div className="flex-1 rounded-r-lg border border-l-0 border-rose-line/40 bg-cream-soft/90 p-1.5 sm:p-2">
            <div className="space-y-0.5">
              <span className="block h-[2px] w-full rounded bg-ink/10" />
              <span className="block h-[2px] w-full rounded bg-ink/10" />
              <span className="block h-[2px] w-3/5 rounded bg-ink/10" />
              <span className="mt-1.5 block h-[2px] w-full rounded bg-ink/10" />
              <span className="block h-[2px] w-4/5 rounded bg-ink/10" />
            </div>
          </div>
        </div>
        <div className="mx-auto h-1 w-[70%] rounded-b bg-accent-dark/70" />
      </div>

      {/* Флакон лаку — по центру знизу */}
      <div
        aria-hidden
        className="absolute bottom-0 left-[43%] flex w-[11%] flex-col items-center sm:w-[9%]"
      >
        <span className="h-1.5 w-2.5 rounded-t-sm bg-accent-dark sm:h-2 sm:w-3" />
        <span className="h-1 w-1.5 bg-accent-dark/80" />
        <span className="flex h-8 w-full items-center justify-center rounded-b-lg rounded-t-md bg-gradient-to-b from-accent to-accent-dark shadow-sm sm:h-11">
          <span className="font-serif text-[4px] tracking-wide text-white/80">N</span>
        </span>
      </div>

      {/* UV-лампа — нижній правий кут */}
      <div aria-hidden className="absolute bottom-0 right-[2%] w-[30%] sm:w-[27%]">
        <div className="relative h-8 overflow-hidden rounded-t-full border border-rose-line/30 bg-white shadow-sm sm:h-11">
          <div className="absolute inset-x-[15%] bottom-0 top-1/2 rounded-t-full bg-gradient-to-b from-accent-soft/70 to-transparent" />
          <span className="absolute left-1/2 top-1.5 -translate-x-1/2 whitespace-nowrap font-serif text-[4px] tracking-[0.15em] text-accent-dark/70 sm:text-[5px]">
            NATALIEVA
          </span>
        </div>
        <div className="mx-auto h-1 w-[88%] rounded-b-md border-x border-b border-rose-line/30 bg-cream-soft" />
      </div>
    </div>
  );
}

/**
 * 404-сторінка, за мокапом `404Page.png` (розділ 0.12 у `TASKS_DETAILED.md`
 * раніше посилався на `mockup-06-404.html` — замінено 17.07.2026, сесія 8).
 *
 * **18.07.2026, сесія 10 — переверстано за прямим проханням користувача**
 * ("максимально точно по макету, бо зараз сторінка дуже відрізняється").
 * Зміни відносно сесії 8:
 * - Кнопку "Back to main page" повернуто до тексту з мокапу — "Back to
 *   Dashboard" — і вона тепер веде в приватний кабінет (`/profile`), а не
 *   на лендінг. Попереднє рішення (текст задачі 0.12.1 до завантаження
 *   мокапу) вважалося свідомим, але після прямої вказівки користувача
 *   пріоритет — точна відповідність зображенню мокапу.
 * - Картки "Blog" і "Contact Support" без `href` більше не затемнені
 *   (`opacity-60` прибрано) — в мокапі всі 4 картки виглядають однаково,
 *   різниця лише в тому, що дві з них не обгорнуті в `Link`.
 * - Іконка картки "All Courses" — новий `BookIcon` (стос книг, як у
 *   мокапі) замість `GraduationCapIcon`; іконка "Contact Support" — новий
 *   `HeadphonesIcon` замість `ChatIcon` (обидва додані в `icons.tsx`).
 * - Ілюстрація праворуч від заголовка повністю переверстана: замість
 *   одного квадратного фото — багатошарова композиція
 *   (`Hero404Illustration`, див. коментар вище) з ноутбуком, нотатником,
 *   книгою, флаконом лаку, UV-лампою й квітами, ближче до мокапу.
 * - Додано декоративний "мазок" у верхньому правому куті сторінки (за
 *   рожевими розводами в кутах мокапу), у стилі вже наявного
 *   `DecorativeBackground.tsx`.
 *
 * 0.12.1 — контурне "404" (`WebkitTextStroke`, бо в Tailwind v4 немає
 * утиліти для text-stroke), заголовок і опис англійською — як у мокапі
 * (це саме текст мокапу, а не помилка перекладу). "Browse Courses" →
 * `/courses`, "Go Home" → `/`.
 *
 * 0.12.2 — блок "Maybe you were looking for..." з 4 картками
 * (`LOOKING_FOR_CARDS`); клікабельні лише 2 з реальними сторінками (All
 * Courses → `/courses`, My Lessons → `/lessons`), Blog і Contact Support —
 * без `href` (`<div>` замість `<Link>`), сторінок ще не існує.
 *
 * 0.12.4 — файл сам є `app/not-found.tsx`, спецфайл Next.js App Router,
 * рендериться автоматично для будь-якого неіснуючого маршруту.
 */
export default function NotFound() {
  const [loggedIn, setLoggedIn] = useState(true);
  const toolsPhoto = COURSES.find(
    (c) => c.slug === "materialy-ta-instrumenty-profi",
  )?.coverImage;

  return (
    <div className="flex flex-1 flex-col">
      <Header
        user={
          loggedIn ? { name: DEMO_PROFILE.name, avatarUrl: DEMO_PROFILE.avatarUrl } : null
        }
        onLogout={() => setLoggedIn(false)}
      />

      <main className="relative flex-1 overflow-hidden py-12 sm:py-16">
        {/* Рожеві розводи в кутах сторінки — за мокапом, у стилі
            DecorativeBackground.tsx */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <svg
            className="absolute -right-10 -top-10 h-56 w-72 text-rose-line/40"
            viewBox="0 0 260 200"
            fill="none"
          >
            <path
              d="M10 170 Q90 50 170 90 T250 20"
              stroke="currentColor"
              strokeWidth="34"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>
          <svg
            className="absolute -bottom-12 -left-10 h-56 w-72 text-rose-line/40"
            viewBox="0 0 260 200"
            fill="none"
          >
            <path
              d="M10 30 Q90 150 170 110 T250 180"
              stroke="currentColor"
              strokeWidth="34"
              strokeLinecap="round"
              opacity="0.5"
            />
          </svg>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <p
              className="font-serif text-8xl leading-none text-transparent sm:text-9xl"
              style={{ WebkitTextStroke: "2px var(--color-rose-line)" }}
            >
              404
            </p>
            <h1 className="mt-4 font-serif text-3xl text-ink sm:text-4xl">
              Oops! This page has gone missing.
            </h1>
            <p className="mt-3 max-w-md text-sm text-muted sm:text-base">
              The page you&apos;re looking for may have been moved, deleted, or never
              existed. Let&apos;s get you back to learning.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/profile">
                <Button icon={<ArrowLeftIcon size={16} />} iconPosition="left">
                  Back to Dashboard
                </Button>
              </Link>
              <Link href="/courses">
                <Button
                  variant="outline"
                  icon={<GridIcon size={16} />}
                  iconPosition="left"
                >
                  Browse Courses
                </Button>
              </Link>
            </div>

            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-accent-dark hover:underline"
            >
              Go Home
              <ArrowRightIcon size={14} />
            </Link>
          </div>

          <Hero404Illustration toolsPhoto={toolsPhoto} />
        </div>

        <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20">
          <p className="text-center font-serif text-2xl text-ink">
            Maybe you were looking for...
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {LOOKING_FOR_CARDS.map((card) => {
              const cardInner = (
                <>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent-dark">
                    <card.icon size={20} />
                  </span>
                  <span className="mt-3 block font-serif text-base text-ink">
                    {card.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {card.description}
                  </span>
                  <span className="mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent-dark">
                    <ArrowRightIcon size={14} />
                  </span>
                </>
              );

              const cardClassName =
                "rounded-2xl border border-rose-line/40 bg-white p-5 transition-colors";

              return card.href ? (
                <Link
                  key={card.title}
                  href={card.href}
                  className={`${cardClassName} hover:border-accent/60`}
                >
                  {cardInner}
                </Link>
              ) : (
                <div key={card.title} className={`${cardClassName} cursor-default`}>
                  {cardInner}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl border-t border-rose-line/30 px-6 pt-8 text-center sm:mt-20">
          <p className="text-xs tracking-wide text-muted uppercase">Error Code: 404</p>
          <p className="mt-3 font-serif text-xl tracking-wide text-accent-dark">
            NATALIEVA
          </p>
          <p className="text-[10px] tracking-[0.2em] text-muted">
            GEL POLISH • NAIL EXTENSIONS
          </p>
        </div>
      </main>
    </div>
  );
}
