# CLAUDE.md — Natalieva LMS

Контекст і правила проєкту для роботи в нових сесіях Claude Code / Claude.

## Що це за проєкт

LMS-платформа безкоштовного курсу манікюру "Natalieva" (Gel Polish • Nail Extensions).
Публічна частина: лендінг курсу, сторінки уроків (відео + стаття + квіз + коментарі),
кабінет користувача. Адмінка: CRUD курсів/уроків/статей/квізів.

Повний детальний план тасок — `TASKS_DETAILED.md` (єдиний чекліст; окремого
короткого `TASKS.md` в проєкті ніколи не було — рішення 3.29, свідомо не заводили).
Поточний статус і наратив по сесіях — `IMPLEMENTATION_STATUS.md`.

**Статус на 01.08.2026:** Фази 0–8 завершені повністю. Фаза 9 ("Полірування") —
20/20, теж завершена. Проєкт функціонально готовий; детальний стан і залишкові
рекомендації (напр. одноразовий живий прогін `npm run dev` для фінальної перевірки —
вся розробка велась у пісочниці без мережевого доступу до Prisma engine binaries і
`next build`) — у "Наступні кроки" в кінці `IMPLEMENTATION_STATUS.md`.

## Стек

- Next.js 15 (App Router), React 18, TypeScript
- TailwindCSS 4 (design tokens у `app/globals.css`, через `@theme inline`)
- Prisma (PostgreSQL, моделі у `prisma/schema.prisma` — див. розділ "База даних та Prisma CLI" нижче)
- Auth.js (NextAuth v5, credentials provider)
- Redux Toolkit (глобальний клієнтський стейт-менеджер — див. розділ "Стейт-менеджмент" нижче)
- Tiptap (статті уроків)

## Стейт-менеджмент

**Redux Toolkit** (`@reduxjs/toolkit` + `react-redux`), підключений 23.07.2026. Стор і
всі slice'и — у `lib/store/`:

- `lib/store/store.ts` — `configureStore` з усіма reducer'ами
- `lib/store/hooks.ts` — типізовані `useAppDispatch`/`useAppSelector` (використовувати
  ЗАВЖДИ замість "голих" хуків з `react-redux`)
- `lib/store/StoreProvider.tsx` — `<Provider>`, підключений у `app/layout.tsx` як
  найзовнішня обгортка (вище `SessionProvider`/`AuthModalProvider`)
- `lib/store/slices/*.ts` — по одному slice на домен: `progressSlice` (прогрес гостя),
  `homeworkSlice` (здані відео ДЗ), `commentsSlice` (власні коментарі + реакції),
  `settingsSlice` (видимість ДЗ на публічному профілі), `featuredCourseSlice`
  (вибір курсу для лендінгу адміном), `authModalSlice` (яка модалка авторизації відкрита)

**Що йде в Redux, а що лишається на `useState`:** у store — лише стан, яким реально
ділиться кілька незалежних сторінок/компонентів (крос-компонентний стан). Суто локальний
UI-стан одного компонента (значення полів форми, чи відкритий dropdown, `loading` на
кнопці) навмисно лишається на звичайному `useState` — переносити його в Redux було б
надлишковим ускладненням, а не покращенням архітектури.

**Патерн синхронізації з `localStorage`:** кожен slice — це лише кеш у пам'яті на час
життя вкладки. Джерело правди для збереження між сесіями браузера й далі
`lib/progress/local*.ts`-модулі (чисті функції читання/запису `localStorage`, без React) —
їх НЕ чіпали. Хуки-обгортки (`lib/progress/useLocal*.ts`, `useFeaturedCourse`,
`useAuthModal` з `components/auth/AuthModalContext.tsx`) при кожній мутації одночасно (а)
пишуть у `localStorage` через відповідну `local*.ts`-функцію і (б) диспатчать Redux-екшн з
уже перерахованим результатом. При першому монтуванні (`useEffect`, керується прапорцем
`hydrated` у самому slice, щоб не перечитувати `localStorage` вдруге при переході між
сторінками) стор "гідрується" даними з `localStorage` — той самий підхід, що й раніше
(старт з порожнього/дефолтного значення на сервері, щоб уникнути hydration mismatch).

**Зовнішній API хуків не змінився.** `useLocalProgress`, `useLocalHomework`,
`useLocalComments`, `useHomeworkVisibility`, `useFeaturedCourse`, `useAuthModal` —
однакові сигнатури до і після переходу на RTK; жоден зі сторінок-споживачів
(`/lessons/[slug]`, `/profile`, `/my-learning`, `/homework`, `/settings`, `/users/[id]`,
`Header`, `GuestGate`, `CommentsBlock`, `HomeworkBlock` тощо) не потребував правок.

## База даних та Prisma CLI

**СУБД: PostgreSQL, хоститься на Supabase — НАВІТЬ ЛОКАЛЬНО** (перехід з
SQLite на PostgreSQL виконано 24.07.2026 — деталі в `IMPLEMENTATION_STATUS.md`,
розділ 1.27; подальший перехід із локального Docker-Postgres на Supabase-хостинг
відбувся під час фази MSG+ — Realtime/Postgres Changes (MSG+.2, 03.09.2026)
слухає зміни лише в базі, якою керує сам Supabase, тож `DATABASE_URL` для
розробки й продакшену веде на той самий Supabase-проєкт, окремого локального
сервера БД немає). **Виправлено 04.09.2026** — попередня версія цього розділу
описувала локальний Docker/нативний Postgres, це застаріло.

`DATABASE_URL` — рядок підключення з Supabase-проєкту (Project Settings →
Database → Connection string), а не `localhost`. Для роботи з приватними
повідомленнями (MSG+) додатково потрібні (`.env`, докладніше —
`lib/realtime/supabaseClient.ts`/`supabaseRealtimeToken.ts`):
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Project
  Settings → API.
- `SUPABASE_JWT_SECRET` — Project Settings → API → JWT Settings ("Legacy
  JWT Secret"); ІНШИЙ секрет, ніж `AUTH_SECRET` — не плутати.

**Стандартний Prisma-флоу** (проти реального Supabase-Postgres, не файла):

- `npm install` — підтягує `postinstall`-хук `prisma generate` автоматично
- `npx prisma migrate deploy` — застосовує наявні міграції (включно з
  `20260903110000_messages_realtime_rls/` — RLS-політики й додавання
  `Message` у публікацію `supabase_realtime`, MSG+.2) до Supabase-бази;
  для нових змін схеми в майбутньому — Prisma сама згенерує нову міграцію
- `npx prisma db seed` — наповнює БД тестовими даними (запускається автоматично одразу
  після `migrate dev`, якщо БД щойно створена; вручну — командою окремо)
- `npx prisma studio` — відкрити веб-інтерфейс для огляду та редагування таблиць БД
- Клієнт БД: екземпляр-синглтон імпортується з `lib/prisma.ts` (`import { prisma } from '@/lib/prisma'`).
- Enums: TypeScript Enum-типи домену зафіксовані у `lib/enums.ts`; у `schema.prisma`
  відповідні поля (`role`, `videoProvider`, `type`, `reason` тощо) навмисно лишені як
  `String`, а не нативний Postgres `enum` — так було зроблено ще для SQLite (де enum
  не підтримується) і свідомо НЕ переведено на нативні enum'и після переходу на
  Postgres, щоб не розширювати задачу понад "змінити СУБД"; перехід на нативні
  `enum`-типи Postgres — окрема опційна задача на майбутнє, не наразі.
- **Тестові облікові записи після seed** (сесія 23.07.2026, Фаза 2 — раніше
  паролі в seed були фейковими заглушками, логін не працював, виправлено):
  - `admin@natalieva.com` / `password123` — роль `ADMIN`
  - `user@natalieva.com` / `password123` — роль `USER`
  - Усі фейкові юзери рейтингу (`*@example.com`) — той самий пароль `password123`

**⚠️ Важливо:** усе вище перевірено лише статичним аналізом (схема, SQL міграції,
`tsc`/`eslint`) — Claude-сесія, у якій це робилось, працює в пісочниці без мережевого
доступу до `binaries.prisma.sh`, звідки Prisma завантажує рушій БД, тому живий запуск
`prisma migrate dev`/`db seed`/логіну там неможливий (та сама причина, що заважала
перевірити це й для SQLite раніше). Перший реальний прогін цих команд варто зробити у
вас локально й звірити результат із очікуваним вище.

## Архітектура модулів (обов'язково для будь-якої бекенд-фічі)

Кожен домен у `modules/<domain>/` має шар:

```
modules/<domain>/
  schema.ts      — Zod-схеми + TS-типи (Input/Output)
  repository.ts  — прямі запити до Prisma, без бізнес-логіки
  service.ts     — бізнес-логіка, валідація, правила
  actions.ts     — Next.js server actions ("use server"), викликають service
  index.ts       — публічний експорт модуля (тільки те, що потрібно ззовні)
```

UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ з `modules/<domain>/index.ts`,
ніколи напряму з `repository.ts`/`service.ts`.

## Video abstraction (задача 4.11 — контракт, як додати нового провайдера)

`components/lesson/VideoPlayer.tsx` — єдина точка входу для відтворення відео уроку в
усьому проєкті (і статичний `/lessons/[slug]`, і реальний
`/courses/[slug]/lessons/[lessonId]`). Диспетчер за пропом `provider`:

- `"YOUTUBE"` (за замовчуванням) → рендерить `YoutubePlayer.tsx` — реальна обгортка над
  YouTube IFrame Player API (не звичайний `<iframe src="…/embed/…">` з Фази 0): скрипт
  `https://www.youtube.com/iframe_api` завантажується один раз на застосунок
  (module-level проміс-синглтон), `YT.Player` створюється в `useEffect`, знищується при
  розмонтуванні/зміні `videoId`.
- `"CUSTOM"` (зарезервовано на майбутнє, self-hosted плеєр) → поки що той самий фолбек
  "Відео недоступне", що й для помилки відтворення (задача 4.7) — не тому що це помилка,
  а тому що провайдера ще не реалізовано.

**Спільний контракт** (`VideoPlayerProps`) не залежить від провайдера:
`provider?`, `videoId`, `title`, `className?`, `onProgress?({ currentTime, duration })`,
`onEnded?()`. Підключення нового провайдера (наприклад, Vimeo чи власний self-hosted
плеєр) — це (1) новий компонент за тим самим контрактом (як `YoutubePlayer.tsx`), (2)
одна нова гілка в диспетчері `VideoPlayer.tsx`, (3) нове значення в `VideoProvider`
union-типі й `lib/enums.ts`. Жодна сторінка, що вже використовує `<VideoPlayer />`, не
потребує змін.

**Рішення щодо контролів (задача 4.6): нативні контроли YouTube, не кастомний оверлей.**
`components/lesson/VideoPlayerControls.tsx` (плейсхолдер-панель play/pause/гучність/PiP/
fullscreen ще з Фази 0, задача 0.7.10) НЕ підключений до реального стану `YT.Player` і
ніде не рендериться поряд з `VideoPlayer` — лишається невикористаним демо-компонентом.
Причина: керування нативним YouTube-плеєром через `postMessage`-команди API поверх його
ж вбудованого UI означало б або дві панелі керування одним відео (плутанина для
користувача), або приховування нативних контролів (втрата стандартних клавіш/жестів
доступності "з коробки"). Для MVP цього не варто робити.

**`onEnded`/`onProgress` підключені, але свідомо НІДЕ не викликають авто-позначення уроку
пройденим** (задача 4.5, "опційно, або лишити ручне позначення 'пройдено'" — обрано друге
навмисно): на статичному `/lessons/[slug]` завершення уроку й так прив'язане до
проходження квізу (`markComplete` викликається з `onComplete` квізу, не з відео) — це
свідомий продуктовий вибір ще з Фази 0, змінювати його поза межами задачі "video
abstraction" не було сенсу. На реальному `/courses/[slug]/lessons/[lessonId]` прогрес
взагалі не зберігається — `modules/progress` як окремий модуль ще не існує (Фаза 5/7).

**Парсинг YouTube-посилань** — `lib/youtube.ts`: `extractYoutubeId(url)` і
`isYoutubeUrl(url)` (тепер `isYoutubeUrl` — тонка обгортка над `extractYoutubeId`, єдине
джерело правди, задача 4.4) розпізнають усі поширені формати:
`youtube.com/watch?v=…` (з довільними додатковими query-параметрами типу `&t=10s`),
`youtu.be/…`, `youtube.com/embed/…`, `youtube.com/shorts/…`, `m.youtube.com/…`.
Валідація на бекенді (`modules/lessons/schema.ts`, задача 4.10) використовує ту саму
`isYoutubeUrl` — виправлення в `lib/youtube.ts` автоматично покращує і валідацію.

## Ключові бізнес-правила

- **Уроки не блокуються.** Усі уроки курсу доступні одразу, без послідовного
  розблокування. `Progress.completed` — лише позначка "пройдено", не гейт доступу.
- **Вступний трейлер курсу** — окреме відео "Про курс" (`INTRO_LESSON`), живе тільки
  на лендінгу курсу (секція: відео зліва / опис курсу справа), НЕ є записом `Lesson`
  і не входить у нумеровану програму курсу. Урок **"Знайомство. Список відтворення
  для новачка"** — це урок №1 програми (`LESSONS[0]`), доступний у `/lessons` як усі
  інші, зі своєю статтею/ДЗ/квізом.
- **Гість може проходити курс без реєстрації.** Прогрес гостя — у `localStorage`
  (`lib/progress/localProgress.ts`, хук `lib/progress/useLocalProgress.ts` —
  спрощена версія вже підключена у Фазі 0; повна структура з `courseId`/`quizScore`
  і server-sync — Фаза 5/7). При логіні/реєстрації — one-time merge у БД
  (`modules/progress` → `syncLocalProgress`), потім `localStorage` очищається.
  CTA-кнопки на лендінгу ведуть напряму в уроки, а не в AuthModal.
  - **Розмежування "де що зберігається" (задача 0.19, за прямим проханням
    користувача).** Для незареєстрованого відвідувача в `localStorage`
    зберігається ВИКЛЮЧНО прогрес проходження уроків і квізів
    (`lib/progress/localProgress.ts`) — і більше нічого. Усе інше вимагає
    реєстрації:
    - **Домашні завдання** — здача ДЗ (`HomeworkBlock`) вимагає логіну; гість
      бачить `GuestHomeworkBanner` замість форми (той самий патерн, що вже
      був для коментарів — `GuestCommentBanner`). Чекліст пунктів ДЗ гість
      все ще бачить, лише саму здачу — ні.
    - **Коментарі** — вже вимагали логіну (`GuestCommentBanner`, задача
      0.7.22), без змін.
    - Для зареєстрованого користувача прогрес/ДЗ/коментарі зберігаються
      на бекенді (`modules/progress`, `modules/homework`, `modules/comments`,
      Фаза 3+/5+/7), а не в `localStorage`.
  - **Приватний кабінет недоступний незареєстрованому відвідувачу.**
    `/profile`, `/certificates`, `/my-learning`, `/settings`, `/homework`, і
    "власні" гілки `/users/[id]` та `/users/[id]/certificates` — усі
    перевіряють `loggedIn` і рендерять новий `<GuestGate />`
    (`components/account/GuestGate.tsx`: `Header` без сайдбару кабінету +
    заклик зареєструватися/увійти) замість вмісту, якщо відвідувач не
    залогінений.
    **Оновлено 23.07.2026 (Фаза 2, задача 2.18):** `/profile` і
    `/my-learning` тепер захищені реальною сесією Auth.js — дворівнево,
    той самий принцип "не тільки в UI", що і для `/admin/*` нижче:
    1. `middleware.ts` (edge-safe, через `authConfig` без провайдерів)
       редіректить незалогіненого відвідувача на `/?authModal=login&callbackUrl=...`
       ще до рендеру сторінки; `AuthModalAutoOpen` (в `app/layout.tsx`)
       читає ці query-параметри й відкриває `AuthModal`.
    2. Сама сторінка додатково перевіряє `useSession()` як другий рівень
       захисту (`status === "authenticated"`).
       Решта сторінок кабінету (`/settings`, `/homework`, `/certificates`,
       `/users/[id]`) ЗАЛИШАЮТЬСЯ на клієнтському демо-тоглі `loggedIn` (за
       замовчуванням `true`, стає `false` після "Вийти" в `AccountSidebar`) —
       задача 2.18 явно стосувалась лише `/my-learning` і `/profile`; переведення
       решти на реальну сесію — окрема задача поза Фазою 2 (за тим самим
       патерном, коли до неї дійде черга). **Виняток (задача 9.15):**
       перемикач видимості ДЗ на `/settings` конкретно бере реальний `userId`
       через `useSession()` і синхронізує `User.homeworkVisible` в БД
       (`updateHomeworkVisibilityAction`, `modules/profile`) — точковий виняток
       лише для цього одного поля, а не переведення всієї сторінки на реальну
       сесію.
- **Каталог курсів `/courses`** — двошаровий, той самий принцип "два датасети",
  що й для ДЗ вище. `CoursesCatalogClient.tsx` показує статичні макетні картки
  (`lib/data/courses.ts`, мокап `mockup-01-courses.html`) ЗМІШАНІ з реальними
  опублікованими курсами з БД (`modules/courses`, `listCoursesService`,
  Фаза 3) — реальний курс підміняє відповідну статичну картку за slug'ом, якщо
  збігається, інакше показується як додаткова картка. Реальний курс веде на
  `/courses/[slug]` (справжній Prisma-лендінг, `getCourseBySlugService`,
  задача 3.14) з реальними уроками на `/courses/[slug]/lessons/[lessonId]`;
  легасі демо-картки і далі ведуть на статичний `/lessons/[slug]`
  (не чіпали — задача 9.16 навмисно позначила цей маршрут `robots: noindex`,
  щоб пошуковики індексували лише реальний каталог). Адмінка (`/admin/courses`,
  Фаза 8) керує РЕАЛЬНИМИ курсами/уроками/статтями/квізами в БД.
  Пункт навігації хедера "Всі курси" веде на `/courses`.
- **Auth — модальне вікно**, не окремі сторінки. `AuthModal` має два внутрішні
  екрани (`login`/`register`), перемикання без роутингу. Відкривається через
  глобальний контекст `openAuthModal('login' | 'register')`.
- **Відео** — абстраговане через `VideoPlayer` (`provider: 'YOUTUBE' | 'CUSTOM'`).
  Зараз тільки YouTube, але контракт компонента не повинен залежати від провайдера.
- **Ролі**: `USER`, `ADMIN`. Middleware захищає `/admin/*`. Перевірка ролі
  обов'язкова і на рівні server actions, не тільки middleware.
  **Технічна деталь (23.07.2026):** `middleware.ts` виконується в Edge
  Runtime, тому НЕ імпортує `auth` з повного `@/auth` (там
  `CredentialsProvider`/`bcryptjs`/Prisma — несумісні з Edge). Замість цього
  використовує edge-safe `authConfig` з `auth.config.ts` (без провайдерів,
  лише JWT/session-колбеки) через `NextAuth(authConfig).auth`; `auth.ts`
  розширює той самий `authConfig`, додаючи провайдер для Node.js-рантайму
  (server actions, route handlers).
  - **Модерація коментарів адміном (задача 0.17):** адмін може видалити
    БУДЬ-ЯКИЙ коментар під уроком (`/lessons/[slug]`), не лише свій — та сама
    кнопка-піктограма, що для автора власного коментаря (`CommentCard`), але
    інша іконка (`ShieldIcon` замість `TrashIcon`) й aria-label, коли видаляє
    не автор. У Фазі 0 (без реальних сесій) роль читається з
    `DEMO_PROFILE.role` (`lib/data/profile.ts`, `useLocalComments(lessonSlug,
isAdmin)` рахує `canDelete = isOwn || isAdmin` на клієнті). У Фазі 2+/3+
    це замінюється на реальну перевірку `session.user.role === 'ADMIN'` і
    ОБОВ'ЯЗКОВО дублюється на рівні server action видалення коментаря
    (`modules/comments`) — той самий принцип "не тільки в UI", що і для
    `/admin/*` вище, бо клієнтський `isAdmin` в UI сам собою нічого не
    захищає.
- **ДЗ здається посиланням на відео**, не фото. Учениця заводить власний
  YouTube-канал і викладає туди виконання завдань — це і підтвердження прогресу
  для курсу, і старт її портфоліо як майбутньої майстрині.
  **Реальний бекенд — `modules/homework`** (задача 9.15, а не Фаза 3, як
  планувалось спершу): `HomeworkSubmission.videoUrl`, `submitHomeworkAction`
  валідує посилання через `isYoutubeUrl`, повторна здача перезаписує попереднє
  посилання. Реальна сторінка уроку рендерить `RealHomeworkBlock`
  (`components/lesson/RealHomeworkBlock.tsx`), легасі `/lessons/[slug]` і
  далі на `HomeworkBlock.tsx`+`localStorage` (`lib/progress/localHomework.ts`)
  — два датасети НЕ синхронізовані одне з одним (той самий принцип, що й
  для курсів/уроків, нижче); здане відео з'являється на `/profile`
  (`HomeworkVideoCard`, справжній вбудований `VideoPlayer`) з обох джерел
  відповідно до того, де саме здавалось.
- **Кабінет `/profile`** (приватний, власний, `AccountLayout`+`AccountSidebar`)
  відрізняється від публічного `/users/[id]` (розділ 0.9 у `TASKS_DETAILED.md`,
  збудовано) — перший доступний тільки залогіненому власнику (див.
  `GuestGate` вище) і має "Налаштування"/"Вийти", другий — read-only для
  будь-кого (демо-профілі `DEMO_PUBLIC_PROFILES`, Фаза 3+ — реальні юзери).

## SEO-метадані (задачі 9.16–9.17)

- **`title.template`** у кореневому `app/layout.tsx` (`"%s — Natalieva LMS"`) —
  дочірні сторінки задають лише короткий `title` (напр. `"Профіль"`), суфікс
  бренду додається автоматично.
- **Client-компонент не може експортувати `metadata`/`generateMetadata`**
  напряму (обмеження Next.js App Router). Для сторінок з `"use client"` у
  `page.tsx` (більшість кабінету — `/my-learning`, `/profile`, `/settings`,
  `/certificates`, `/homework`, `/lessons`, `/users/[id]`) metadata живе в
  сусідньому `layout.tsx` того самого маршруту (Server Component-обгортка,
  просто рендерить `{children}`) — цей патерн повторюється для будь-якої
  нової client-сторінки, якій знадобляться власні metadata.
- **`robots: { index: false, follow: false }`** — на приватних сторінках
  (`/admin`, `/profile`, `/settings`) і легасі-дублікаті (`/lessons`, щоб не
  конкурував з реальним `/courses` у видачі). Продубльовано в `app/robots.ts`
  (`Disallow`) — краулер перевіряє `robots.txt` ДО заходу на сторінку.
- **`app/sitemap.ts`** — статичні публічні маршрути + реальні опубліковані
  курси (`listCoursesService(true)`); `/users/[id]` і уроки свідомо не
  перелічуються поіменно (масштаб не виправдовує).
- **`app/icon.svg`** — брендований favicon (Next.js App Router конвенція,
  автоматично генерує `<link rel="icon">`), замінив дефолтний
  `app/favicon.ico` від `create-next-app` (лишений як fallback).
- **`NEXT_PUBLIC_SITE_URL`** — env-змінна для `metadataBase`/`sitemap`/
  `robots` (canonical/OG URL, посилання на sitemap). Фолбек — `localhost:3000`
  для розробки; **обов'язково виставити на реальний домен перед релізом**,
  інакше OG-картинки/canonical-посилання в проді вестимуть на localhost.

## Дизайн-токени (`app/globals.css`)

- `--color-cream` (#fdf6f2) — фон
- `--color-accent` (#c17b68) / `--color-accent-dark` (#a85f4f) — primary CTA
- `--color-accent-soft` (#f0d9cf), `--color-rose-line` (#e8c3b6) — декоративні елементи
- `--color-ink` (#2b211d) — основний текст
- `--color-muted` (#7c6c63) — другорядний текст (затемнено з початкового #8a7b73
  у задачі 9.12 — попереднє значення давало ~4.08:1 контрасту на `--color-cream`,
  нижче порогу WCAG AA 4.5:1 для звичайного тексту)
- Шрифти: `--font-serif` (Playfair Display) для заголовків/лого "NATALIEVA",
  `--font-sans` (Inter) для тіла тексту

## Workflow

1. Одна таска з `TASKS_DETAILED.md` за раз (або невеликий пакет — узгоджується
   з користувачем перед стартом).
2. Після завершення пакету тасок — оновити `TASKS_DETAILED.md` (позначки
   `[x]`) і `IMPLEMENTATION_STATUS.md`.
3. У кінці сесії — короткий "resumption summary", щоб нова сесія могла
   продовжити лише за файлами проєкту, без додаткового контексту від
   користувача.

## Команди

```bash
npm run dev       # локальний запуск
npm run build     # прод-збірка
npm run lint      # ESLint
npx prettier --write .   # форматування
```
