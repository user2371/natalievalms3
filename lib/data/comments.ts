/**
 * ТИМЧАСОВІ демо-дані коментарів під уроками (Фаза 0 — UI без бекенду).
 * Буде замінено на `modules/comments` (Prisma) у Фазі 3+. До того часу
 * власні коментарі користувача (форма 0.7.21) і реакції лайк/дизлайк
 * (0.7.23a) зберігаються локально — `lib/progress/localComments.ts`.
 */

export interface Comment {
  id: string;
  lessonSlug: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  /** ISO-дата створення коментаря. */
  createdAt: string;
  text: string;
  likes: number;
  dislikes: number;
}

/**
 * Демо-ідентифікатор "поточного" залогіненого користувача — той самий, що
 * підставляється в `Header`/`/profile` (`Марія Шевченко`). Реальна сесія —
 * Фаза 2 (Auth.js). Використовується, щоб визначити авторство власних
 * коментарів (кнопка видалення 0.7.24) і власний лайк/дизлайк.
 */
export const CURRENT_USER_ID = "demo-user";
export const CURRENT_USER_NAME = "Марія Шевченко";
export const CURRENT_USER_AVATAR_URL: string | null = null;

/**
 * Базові демо-коментарі, показані під кожним уроком незалежно від слага —
 * поки немає реального контенту з БД. Дати навмисно різні, щоб список
 * виглядав природно відсортованим.
 */
export const DEMO_COMMENTS_TEMPLATE: Omit<Comment, "lessonSlug">[] = [
  {
    id: "demo-1",
    authorId: "user-nail-perfection",
    authorName: "nail_perfection",
    authorAvatarUrl: null,
    createdAt: "2026-05-12T14:32:00.000Z",
    text: "Дуже корисний урок! Ніколи не могла зрозуміти, як не затікати під кутикулу. Тепер виходить набагато краще",
    likes: 18,
    dislikes: 0,
  },
  {
    id: "demo-2",
    authorId: "user-beauty-nails",
    authorName: "beauty.nails",
    authorAvatarUrl: null,
    createdAt: "2026-05-12T16:05:00.000Z",
    text: "Підкажіть, будь ласка, якою консистенцією гель-лаку вам зручніше працювати для цієї техніки?",
    likes: 5,
    dislikes: 0,
  },
  {
    id: "demo-3",
    authorId: "user-olha-m",
    authorName: "olha.master",
    authorAvatarUrl: null,
    createdAt: "2026-05-13T09:18:00.000Z",
    text: "Пересмотрела вже тричі, поки не запам'ятала кут нахилу пензля. Дякую за детальний розбір!",
    likes: 9,
    dislikes: 1,
  },
  {
    id: "demo-4",
    authorId: "user-kate",
    authorName: "kate_nailart",
    authorAvatarUrl: null,
    createdAt: "2026-05-14T11:40:00.000Z",
    text: "А що робити, якщо валик дуже чутливий і клієнтці боляче навіть при легкому дотику?",
    likes: 3,
    dislikes: 0,
  },
  {
    id: "demo-5",
    authorId: "user-nataliia",
    authorName: "nataliia.pro",
    authorAvatarUrl: null,
    createdAt: "2026-05-15T08:15:00.000Z",
    text: "Найкраще пояснення техніки покриття під кутикулу, яке я бачила. Дякую за курс!",
    likes: 12,
    dislikes: 0,
  },
];

/** Повертає демо-коментарі для конкретного уроку (однаковий набір під кожним). */
export function getDemoComments(lessonSlug: string): Comment[] {
  return DEMO_COMMENTS_TEMPLATE.map((c) => ({ ...c, lessonSlug }));
}
