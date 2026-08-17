/**
 * Мокові дані для UI-каркасів адмінки (задача 0.13, макет `adminPanel.png`).
 * Це Фаза 0 — "без даних": усі списки нижче лише для наповнення екранів,
 * жодного реального збереження немає (`modules/*` — Фаза 3+/6/8). Форми в
 * адмінці читають ці масиви для початкового стану, а "Зберегти"/"Видалити"
 * лише міняють локальний React-стан сторінки (зникає при перезавантаженні).
 */

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  lessonsCount: number;
  published: boolean;
}

export const ADMIN_COURSES: AdminCourse[] = [
  {
    id: "manicure-basics",
    title: "Манікюр з нуля",
    slug: "manicure-basics",
    lessonsCount: 12,
    published: true,
  },
  {
    id: "professional-manicure",
    title: "Професійний манікюр",
    slug: "professional-manicure",
    lessonsCount: 8,
    published: true,
  },
  {
    id: "hardware-manicure",
    title: "Апаратний манікюр",
    slug: "hardware-manicure",
    lessonsCount: 10,
    published: false,
  },
  {
    id: "nail-design",
    title: "Дизайн нігтів",
    slug: "nail-design",
    lessonsCount: 7,
    published: true,
  },
];

export interface AdminLesson {
  id: string;
  courseId: string;
  order: number;
  title: string;
  duration: string;
}

export const ADMIN_LESSONS: AdminLesson[] = [
  {
    id: "l1",
    courseId: "manicure-basics",
    order: 1,
    title: "Підготовка нігтів",
    duration: "5:22",
  },
  {
    id: "l2",
    courseId: "manicure-basics",
    order: 2,
    title: "Формування форми",
    duration: "6:45",
  },
  {
    id: "l3",
    courseId: "manicure-basics",
    order: 3,
    title: "Покриття базою",
    duration: "7:12",
  },
  {
    id: "l4",
    courseId: "manicure-basics",
    order: 4,
    title: "Покриття кольором",
    duration: "10:30",
  },
  {
    id: "l5",
    courseId: "manicure-basics",
    order: 5,
    title: "Дизайн нігтів",
    duration: "8:50",
  },
];

export type AdminQuestionType = "text" | "image";

export interface AdminAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface AdminQuestion {
  id: string;
  lessonId: string;
  order: number;
  text: string;
  type: AdminQuestionType;
  /** URL картинки — лише для `type === "image"`. */
  imageUrl?: string;
  /**
   * Варіанти відповідей (задача 6.26 — потрібні для повноцінного
   * попереднього перегляду квізу; раніше цього поля не було, бо
   * `AdminQuestion` використовувався лише для списку/редагування назви
   * питання, не для самого проходження). "Single vs multiple choice" тут
   * НЕ окреме поле — той самий принцип, що й у `modules/quizzes`: більше
   * однієї `isCorrect: true` → множинний вибір.
   */
  answers: AdminAnswer[];
}

export const ADMIN_QUESTIONS: AdminQuestion[] = [
  {
    id: "q1",
    lessonId: "l1",
    order: 1,
    text: "Яка форма нігтів найпоширеніша?",
    type: "text",
    answers: [
      { id: "q1a1", text: "Мигдаль", isCorrect: false },
      { id: "q1a2", text: "Овал", isCorrect: true },
      { id: "q1a3", text: "Балерина", isCorrect: false },
      { id: "q1a4", text: "Стилет", isCorrect: false },
    ],
  },
  {
    id: "q2",
    lessonId: "l1",
    order: 2,
    text: "Виберіть правильний інструмент для зняття кутикули",
    type: "image",
    imageUrl: "/heroBlockWide.png",
    answers: [
      { id: "q2a1", text: "Пушер", isCorrect: true },
      { id: "q2a2", text: "Ножиці", isCorrect: false },
      { id: "q2a3", text: "Пилка", isCorrect: false },
    ],
  },
  {
    id: "q3",
    lessonId: "l1",
    order: 3,
    text: "Чим обробляють кутикулу перед покриттям? (декілька правильних)",
    type: "text",
    answers: [
      { id: "q3a1", text: "Ремувером", isCorrect: true },
      { id: "q3a2", text: "Знежирювачем", isCorrect: true },
      { id: "q3a3", text: "Лаком", isCorrect: false },
    ],
  },
];

export interface AdminComment {
  id: string;
  author: string;
  text: string;
  date: string;
}

export const ADMIN_COMMENTS: AdminComment[] = [
  { id: "c1", author: "Олена", text: "Дуже корисний курс, дякую!", date: "12.05.2024" },
  { id: "c2", author: "Марія", text: "Чекаю на нові уроки!", date: "11.05.2024" },
  { id: "c3", author: "Ірина", text: "Все зрозуміло та доступно.", date: "10.05.2024" },
];

/**
 * Категорії статей для редактора статті (задача 0.18, макет
 * `AdminArticle.png`) — та сама роль, що категорії курсів у фільтрах
 * `/courses`, але окремий список: стаття прив'язана до категорій контенту
 * блогу, не до категорії курсу.
 */
export interface AdminArticleCategory {
  id: string;
  label: string;
}

export const ADMIN_ARTICLE_CATEGORIES: AdminArticleCategory[] = [
  { id: "nail-prep", label: "Підготовка нігтів" },
  { id: "manicure", label: "Манікюр" },
  { id: "gel-polish", label: "Покриття гель-лаком" },
  { id: "nail-design", label: "Дизайн нігтів" },
  { id: "care", label: "Догляд" },
];

export type AdminUserRole = "Користувач" | "Адміністратор";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  role: AdminUserRole;
}

export const ADMIN_USERS: AdminUser[] = [
  {
    id: "u1",
    name: "Олена",
    email: "olena@email.com",
    registeredAt: "12.05.2024",
    role: "Користувач",
  },
  {
    id: "u2",
    name: "Марія",
    email: "maria@email.com",
    registeredAt: "11.05.2024",
    role: "Користувач",
  },
  {
    id: "u3",
    name: "Адмін",
    email: "admin@natalieva.ua",
    registeredAt: "01.05.2024",
    role: "Адміністратор",
  },
];
