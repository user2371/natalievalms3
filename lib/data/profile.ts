/**
 * Дані профілю користувача (`/profile`, `/users/[id]`). Бали й місце в
 * рейтингу — поки що статичні демо-дані: реальної системи балів/рейтингу
 * ще немає (`modules/gamification` — Фаза 5+). Секції "Досягнення" тут
 * НЕМАЄ — прибрана з проєкту (рішення користувача, задача 6.6.15, на
 * профілі лишаються тільки Сертифікати). Здані відео ДЗ і прогрес курсів
 * ВЛАСНОГО користувача — РЕАЛЬНІ, читаються з `localStorage`
 * (`lib/progress/*`), не звідси. Для чужих публічних профілів
 * (`/users/[id]`, задача 0.9.9), поки немає БД/інших користувачів (Фаза
 * 3+), нижче — статичні демо-профілі `DEMO_PUBLIC_PROFILES`.
 */

import { CURRENT_USER_ID } from "@/lib/data/comments";
import type { Certificate } from "@/lib/data/certificates";

export interface DemoProfile {
  /** Той самий ідентифікатор, що й `authorId` власних коментарів (`CURRENT_USER_ID`) — використовується для визначення "це власний профіль" на `/users/[id]`. */
  id: string;
  name: string;
  handle: string;
  email: string;
  avatarUrl: string | null;
  /** Велике фото профілю (окремо від маленького круглого аватара в хедері). */
  photoUrl: string;
  bio: string;
  joinedAt: string; // ISO
  points: number;
  rank: number;
  rankOutOf: number;
  /**
   * Роль поточного демо-користувача (`USER`/`ADMIN`, ті самі значення, що
   * задокументовані в `CLAUDE.md` як реальні ролі системи). У Фазі 0 немає
   * справжньої автентифікації/сесій, тому це єдине джерело "чи є поточний
   * відвідувач адміном" на публічних сторінках (наразі — можливість
   * видалити будь-чий коментар під уроком, задача 0.17). Значення `"ADMIN"`
   * тут навмисне (не `"USER"`), щоб адмінська можливість була одразу видна
   * в демо без додаткових кроків. У Фазі 2+ це поле зникає, а роль
   * читається з реальної сесії (`session.user.role`), з перевіркою і на
   * рівні server actions — не тільки в UI.
   */
  role: "USER" | "ADMIN";
}

export const DEMO_PROFILE: DemoProfile = {
  id: CURRENT_USER_ID,
  name: "Марія Шевченко",
  handle: "@mari.nails",
  email: "mariia@email.com",
  avatarUrl: null,
  photoUrl: "profileDemoPhoto.jpg",
  bio: "Майстер манікюру, яка постійно розвивається та любить нові знання ✨ Вірю, що практика + якісна теорія = ідеальний результат.",
  joinedAt: "2024-05-15",
  points: 890,
  rank: 23,
  rankOutOf: 100,
  role: "ADMIN",
};

export interface PublicHomeworkVideo {
  courseName: string;
  lessonNumber: number;
  lessonTitle: string;
  submittedAt: string; // ISO
  videoId: string;
}

export interface PublicCourseProgress {
  title: string;
  coverImage: string;
  completedLessons: number;
  totalLessons: number;
}

export interface PublicProfile {
  id: string;
  name: string;
  handle: string;
  photoUrl: string;
  bio: string;
  joinedAt: string; // ISO
  points: number;
  rank: number;
  rankOutOf: number;
  completedCourses: PublicCourseProgress[];
  homeworkVideos: PublicHomeworkVideo[];
  /**
   * Сертифікати профілю (задача 0.16 — секція "Сертифікати" замість
   * "Досягнення" на `/profile`/`/users/[id]`). Той самий тип `Certificate`,
   * що й `DEMO_CERTIFICATES` для власного профілю — окремий демонстраційний
   * набір на профіль, поки немає реальної видачі сертифікатів (Фаза 3+/5+).
   */
  certificates: Certificate[];
  /**
   * Чи власник цього профілю дозволив показувати ДЗ стороннім (задача
   * 0.9.5). За замовчуванням `true`; для демонстрації прихованого стану
   * `user-olha-m` нижче має `false`, попри непорожній `homeworkVideos`.
   */
  homeworkVisible?: boolean;
}

/**
 * Демо-профілі ІНШИХ користувачів для публічної сторінки `/users/[id]`
 * (задача 0.9.9) — поки немає БД/реальних акаунтів (Фаза 3+). Ідентифікатори
 * збігаються з `authorId` демо-коментарів (`lib/data/comments.ts`), щоб клік
 * на аватар під коментарем (`CommentCard`) вів на робочий профіль.
 */
export const DEMO_PUBLIC_PROFILES: Record<string, PublicProfile> = {
  "user-nail-perfection": {
    id: "user-nail-perfection",
    name: "Оксана Перфекціоніст",
    handle: "@nail_perfection",
    photoUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80",
    bio: "Майстриня з 4-річним стажем, обожнюю складні дизайни та вчу інших не боятись експериментувати.",
    joinedAt: "2024-01-10",
    points: 1240,
    rank: 3,
    rankOutOf: 100,
    completedCourses: [
      {
        title: "Гель-лак для новачків",
        coverImage:
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80",
        completedLessons: 14,
        totalLessons: 14,
      },
    ],
    homeworkVideos: [
      {
        courseName: "Гель-лак для новачків",
        lessonNumber: 1,
        lessonTitle: "Знайомство. Список відтворення для новачка",
        submittedAt: "2026-05-20T10:00:00.000Z",
        videoId: "gQsqH8k-V-Q",
      },
      {
        courseName: "Гель-лак для новачків",
        lessonNumber: 2,
        lessonTitle: "Історія виникнення гель-лаку. Історія манікюру",
        submittedAt: "2026-05-22T10:00:00.000Z",
        videoId: "BJxa3RQPgrA",
      },
    ],
    // 6 сертифікатів — навмисно більше 5, демонструє кнопку "Показати всі".
    certificates: [
      { id: "op-1", courseName: "Манікюр з нуля", issuedAt: "2024-03-02" },
      { id: "op-2", courseName: "Апаратний манікюр", issuedAt: "2024-04-18" },
      { id: "op-3", courseName: "Покриття гель-лаком", issuedAt: "2024-05-30" },
      { id: "op-4", courseName: "Дизайн нігтів", issuedAt: "2024-07-14" },
      { id: "op-5", courseName: "Нарощування нігтів", issuedAt: "2024-09-01" },
      { id: "op-6", courseName: "Френч та геометрія", issuedAt: "2024-11-20" },
    ],
  },
  "user-beauty-nails": {
    id: "user-beauty-nails",
    name: "Ірина Красунчук",
    handle: "@beauty.nails",
    photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&q=80",
    bio: "Тільки починаю шлях у нейл-індустрії, проходжу курс крок за кроком 🌸",
    joinedAt: "2026-04-02",
    points: 240,
    rank: 67,
    rankOutOf: 100,
    completedCourses: [
      {
        title: "Гель-лак для новачків",
        coverImage:
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80",
        completedLessons: 3,
        totalLessons: 14,
      },
    ],
    // Порожній список навмисно — демонструє empty state (задача 0.9.7).
    homeworkVideos: [],
    certificates: [],
  },
  "user-olha-m": {
    id: "user-olha-m",
    name: "Ольга Майстренко",
    handle: "@olha.master",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80",
    bio: "Манікюрниця, люблю навчатись новому і ділитись досвідом з ученицями.",
    joinedAt: "2025-09-18",
    points: 560,
    rank: 31,
    rankOutOf: 100,
    completedCourses: [
      {
        title: "Гель-лак для новачків",
        coverImage:
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80",
        completedLessons: 8,
        totalLessons: 14,
      },
    ],
    homeworkVideos: [
      {
        courseName: "Гель-лак для новачків",
        lessonNumber: 3,
        lessonTitle: "Будова нігтьової пластини. Що таке гіпоніхій? Матрикс. Лунула",
        submittedAt: "2026-06-01T10:00:00.000Z",
        videoId: "CH_QJ5m571M",
      },
    ],
    // Демо вимкненої видимості (задача 0.9.5): відео здані, але секція
    // прихована для сторонніх переглядів, бо власниця вимкнула показ у
    // Налаштуваннях.
    homeworkVisible: false,
    certificates: [
      { id: "om-1", courseName: "Манікюр з нуля", issuedAt: "2025-11-10" },
      { id: "om-2", courseName: "Апаратний манікюр", issuedAt: "2026-02-04" },
    ],
  },
  "user-kate": {
    id: "user-kate",
    name: "Катерина Ковальчук",
    handle: "@kate_nailart",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
    bio: "Щойно зареєструвалась і дуже хвилююсь перед першим уроком!",
    joinedAt: "2026-07-10",
    points: 0,
    rank: 98,
    rankOutOf: 100,
    // Порожні масиви навмисно — демонструють усі empty state одразу (задача 0.9.7).
    completedCourses: [],
    homeworkVideos: [],
    certificates: [],
  },
  "user-nataliia": {
    id: "user-nataliia",
    name: "Наталія Проценко",
    handle: "@nataliia.pro",
    photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80",
    bio: "Веду власну студію манікюру, курс проходжу, щоб систематизувати знання для учениць.",
    joinedAt: "2024-11-05",
    points: 980,
    rank: 12,
    rankOutOf: 100,
    completedCourses: [
      {
        title: "Гель-лак для новачків",
        coverImage:
          "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&q=80",
        completedLessons: 14,
        totalLessons: 14,
      },
    ],
    homeworkVideos: [
      {
        courseName: "Гель-лак для новачків",
        lessonNumber: 5,
        lessonTitle: "Інструменти. Дезінфекція. Стерилізація",
        submittedAt: "2026-06-10T10:00:00.000Z",
        videoId: "EGEVlIHCClY",
      },
    ],
    certificates: [
      { id: "np-1", courseName: "Манікюр з нуля", issuedAt: "2025-01-15" },
      { id: "np-2", courseName: "Апаратний манікюр", issuedAt: "2025-04-22" },
      { id: "np-3", courseName: "Покриття гель-лаком", issuedAt: "2025-07-09" },
      { id: "np-4", courseName: "Дизайн нігтів", issuedAt: "2025-10-30" },
    ],
  },
};

/** Повертає демо-профіль чужого користувача за `id`, або `undefined`, якщо такого немає (404). */
export function getPublicProfile(id: string): PublicProfile | undefined {
  return DEMO_PUBLIC_PROFILES[id];
}
