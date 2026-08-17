/**
 * ТИМЧАСОВІ статичні дані курсу (Фаза 0 — UI без бекенду).
 * Реальний контент курсу з шапки TASKS_DETAILED.md (YouTube-плейлист).
 *
 * Буде замінено на `modules/courses` (Prisma) у Фазі 3. UI-компоненти,
 * що споживають ці дані, вже написані так, щоб приймати такі самі за
 * формою пропси з майбутнього модуля — заміна джерела даних не повинна
 * вимагати переписування компонентів.
 */

export interface Lesson {
  /** Номер уроку в програмі курсу (1..N). Урок "0. Знайомство" не входить сюди. */
  number: number;
  slug: string;
  title: string;
  youtubeId: string;
  /** Тривалість — заповнюється з реальних даних відео в Фазі 3/адмінці. */
  durationLabel?: string;
  /**
   * Пункти домашнього завдання. Якщо не задано — використовується
   * `DEFAULT_HOMEWORK_ITEMS`. Реальний контент ДЗ на урок редагується
   * з адмінки (Фаза 3), поки що — тимчасові дані.
   */
  homeworkItems?: string[];
  /**
   * Текст статті "Про сьогоднішній урок" (Tiptap-контент у Фазі 3, зараз —
   * простий текст). Якщо не задано — використовується `DEFAULT_ARTICLE_TEXT`.
   */
  articleText?: string;
  /**
   * Пункти чек-листа "Ти дізнаєшся:". Якщо не задано — використовується
   * `DEFAULT_ARTICLE_TAKEAWAYS`.
   */
  articleTakeaways?: string[];
  /**
   * Ілюстративне зображення поруч зі статтею (задача 0.7.13). Якщо не
   * задано — використовується прев'ю відео уроку (`youtubeThumbnail`).
   * Реальні ілюстрації на урок редагуються з адмінки — Фаза 3.
   */
  articleImageUrl?: string;
  /**
   * Питання квізу до уроку. Якщо не задано — використовується типовий
   * набір `DEFAULT_QUIZ_QUESTIONS`. Реальні квізи на урок — Фаза 3.
   */
  quizQuestions?: QuizQuestion[];
}

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
}

export interface QuizQuestion {
  id: string;
  text: string;
  /** Необов'язкова картинка над текстом питання (задача 0.7.15). */
  imageUrl?: string;
  /**
   * Якщо `true` — допускається декілька правильних варіантів (чекбокси),
   * інакше — рівно один правильний варіант (радіо). Задача 0.7.16.
   */
  multiple?: boolean;
  options: QuizOption[];
}

/** Тимчасовий типовий текст статті, поки немає реального контенту з адмінки. */
export const DEFAULT_ARTICLE_TEXT =
  "У цьому уроці ми детально розберемо тему на прикладах, які майстер " +
  "показує наживо на відео. Матеріал розрахований на новачків: пояснення " +
  "йде покроково, без припущення, що ви вже щось знаєте про цю тему. " +
  "Після перегляду відео поверніться до цього блоку, щоб закріпити " +
  "ключові моменти власними словами — це допоможе краще запам'ятати " +
  "матеріал перед виконанням домашнього завдання.";

/** Тимчасовий типовий чек-лист "Ти дізнаєшся:", поки немає реального контенту. */
export const DEFAULT_ARTICLE_TAKEAWAYS: string[] = [
  "Основні поняття теми та як вони застосовуються на практиці",
  "Типові помилки новачків і як їх уникнути",
  "На що звернути увагу під час виконання домашнього завдання",
];

/** Тимчасовий типовий чекліст ДЗ, поки немає реального контенту з адмінки. */
export const DEFAULT_HOMEWORK_ITEMS: string[] = [
  "Перегляньте відео уроку повністю",
  "Виконайте вправу за інструкцією з відео на своїй руці або типсі",
  "Запишіть відео виконання та завантажте його на свій YouTube-канал",
];

/** Тимчасовий типовий квіз, поки немає реального контенту з адмінки. */
export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    text: "Яка мета цього уроку?",
    multiple: false,
    options: [
      {
        id: "q1-a",
        text: "Ознайомитися з теорією та побачити практику на прикладі",
        correct: true,
      },
      {
        id: "q1-b",
        text: "Просто переглянути відео без запам'ятовування",
        correct: false,
      },
      {
        id: "q1-c",
        text: "Пропустити теорію і одразу перейти до наступного уроку",
        correct: false,
      },
    ],
  },
  {
    id: "q2",
    text: "Що варто зробити перш ніж переходити до домашнього завдання?",
    multiple: false,
    options: [
      { id: "q2-a", text: "Переглянути відео уроку повністю", correct: true },
      { id: "q2-b", text: "Прочитати урок по діагоналі", correct: false },
      { id: "q2-c", text: "Одразу почати без підготовки", correct: false },
    ],
  },
  {
    id: "q3",
    text: "Які з наступних тверджень правильні щодо цього уроку? (декілька варіантів)",
    multiple: true,
    options: [
      { id: "q3-a", text: "Матеріал розрахований на новачків", correct: true },
      { id: "q3-b", text: "Пояснення подається покроково", correct: true },
      {
        id: "q3-c",
        text: "Урок вимагає попереднього професійного досвіду",
        correct: false,
      },
    ],
  },
];

export interface IntroLesson {
  title: string;
  youtubeId: string;
}

/**
 * Вступний трейлер курсу (розділ "Про курс" на лендінгу). Це окреме відео
 * про сам курс — НЕ урок і не входить у нумеровану програму `LESSONS`.
 */
export const INTRO_LESSON: IntroLesson = {
  title: "Про курс",
  youtubeId: "itF3EZOozUE",
};

export const LESSONS: Lesson[] = [
  {
    number: 1,
    slug: "znayomstvo",
    title: "Знайомство. Список відтворення для новачка",
    youtubeId: "gQsqH8k-V-Q",
  },
  {
    number: 2,
    slug: "istoriya-gel-laku",
    title: "Історія виникнення гель-лаку. Історія манікюру",
    youtubeId: "BJxa3RQPgrA",
  },
  {
    number: 3,
    slug: "budova-nigtovoi-plastyny",
    title: "Будова нігтьової пластини. Що таке гіпоніхій? Матрикс. Лунула",
    youtubeId: "CH_QJ5m571M",
  },
  {
    number: 4,
    slug: "hvoroby-nigtovoi-plastyny",
    title: "Хвороби нігтьової пластини. Оніхолізис. Оніхомікоз. Зелена бактерія",
    youtubeId: "8DQcVUqXnDo",
  },
  {
    number: 5,
    slug: "instrumenty-dezinfekciya",
    title: "Інструменти. Дезінфекція. Стерилізація",
    youtubeId: "EGEVlIHCClY",
  },
  {
    number: 6,
    slug: "materialy-mini-maxi",
    title: "Матеріали для манікюру mini та maxi",
    youtubeId: "_vz6s78eJbs",
  },
  {
    number: 7,
    slug: "vydy-znyattya-gel-laku",
    title: "Види зняття гель-лаку",
    youtubeId: "d6eykcNJ4Qo",
  },
  {
    number: 8,
    slug: "opyl-nigtiv",
    title: "Опил нігтів",
    youtubeId: "Hc0B8bpBxo0",
  },
  {
    number: 9,
    slug: "manikyur-dlya-novachka",
    title: "Манікюр для новачка. Класичний манікюр. Обрізний манікюр",
    youtubeId: "UotYcQQ0KzI",
  },
  {
    number: 10,
    slug: "kombinovanyi-manikyur",
    title: "Комбінований манікюр",
    youtubeId: "wIEv7QTt8g4",
  },
  {
    number: 11,
    slug: "manikyur-z-remuverom",
    title: "Манікюр з ремувером",
    youtubeId: "aMWxpyPFVqs",
  },
  {
    number: 12,
    slug: "etapy-pokryttya-gel-lakom",
    title: "Етапи покриття нігтів гель-лаком",
    youtubeId: "mSFZU2TWkD4",
  },
  {
    number: 13,
    slug: "legkyi-dyzain-nigtiv",
    title: "Легкий дизайн нігтів",
    youtubeId: "WRsNIlLus68",
  },
  {
    number: 14,
    slug: "french-manikyur-dlya-novachka",
    title: "Френч. Манікюр для новачка",
    youtubeId: "2nF0Fj1kQqI",
  },
];

export function youtubeThumbnail(youtubeId: string) {
  return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}
