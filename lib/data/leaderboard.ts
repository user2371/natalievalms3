/**
 * Дані для сторінки "Топ 100" (`/leaderboard`, задача 0.10b), за мокапом
 * `top100page.png` (розділ 0.10b у `TASKS_DETAILED.md` раніше посилався на
 * `mockup-03-leaderboard.html` — замінено на прохання користувача).
 *
 * Реальної системи балів/рейтингу ще немає (`modules/gamification` —
 * Фаза 5+), тож усі 100 місць — згенеровані демо-дані. Щоб не суперечити
 * вже наявним `rank`/`points` у `DEMO_PROFILE` та `DEMO_PUBLIC_PROFILES`
 * (`lib/data/profile.ts`), ті самі 6 користувачів "закріплені" на своїх
 * реальних місцях (`ANCHORS`) з реальними балами; решта місць — плавна
 * інтерполяція балів між закріпленими точками + згенеровані імена, щоб
 * уникнути 94 вручну написаних рядків. Детерміновано (без `Math.random`) —
 * той самий результат при кожному білді/рендері.
 *
 * Місця 1 і 2 (нема кому їх "займати" серед наявних демо-профілів) —
 * вигадані лідери з балами, вищими за реальний максимум (`user-nail-perfection`,
 * 1240 балів на місці 3) — узгоджено з мокапом (там теж 2 вигадані лідери
 * над реальним "nail.perfection"), але з балами в масштабі вже наявних
 * даних проєкту, а не абсолютними числами з мокапу (2450/2320) — інакше
 * стрибок від 1240 (місце 3) до умовних значень мокапу виглядав би різко.
 */

import { CURRENT_USER_ID } from "@/lib/data/comments";
import { DEMO_PROFILE, DEMO_PUBLIC_PROFILES } from "@/lib/data/profile";

export interface LeaderboardUser {
  rank: number;
  /** Якщо є — рядок клікабельний і веде на `/users/[id]`. Немає в реальних `DEMO_PUBLIC_PROFILES` — Фаза 3+ додасть усіх. */
  id?: string;
  name: string;
  handle: string;
  photoUrl?: string | null;
  points: number;
}

const FILLER_HANDLES = [
  "nail_art.love",
  "gel.style",
  "manicure_pro",
  "nails.by.vika",
  "perfect.nails",
  "nailstudio.k",
  "pastel.nails",
  "shine.master",
  "vernis.pro",
  "lakua.studio",
  "velvet.tips",
  "rose.manicure",
  "glow.nails",
  "chic.polish",
  "dreamy.nails",
  "elegant.manicure",
  "artnails.ua",
  "frenchtip.pro",
  "glossy.nails",
  "softnails.kv",
  "trendy.manicure",
  "luxenails.ua",
  "stella.nails",
  "aurora.manicure",
  "bloom.nails",
  "crystal.tips",
  "honey.nails",
  "ivory.manicure",
  "jade.nails",
  "kira.polish",
];

const FILLER_FIRST_NAMES = [
  "Анна",
  "Марина",
  "Софія",
  "Юлія",
  "Вікторія",
  "Дарина",
  "Олена",
  "Каріна",
  "Тетяна",
  "Аліна",
  "Крістіна",
  "Валерія",
  "Богдана",
  "Єва",
  "Злата",
  "Мілена",
  "Ілона",
  "Роксолана",
  "Соломія",
  "Уляна",
];

const FILLER_LAST_NAMES = [
  "Ковальчук",
  "Мельник",
  "Бондаренко",
  "Ткаченко",
  "Кравченко",
  "Шевчук",
  "Поліщук",
  "Гончаренко",
  "Савченко",
  "Марченко",
];

/** Закріплені місця з реальними балами/профілями — решта інтерполюється між ними. */
const ANCHORS: LeaderboardUser[] = [
  { rank: 1, name: "Христина Нейл", handle: "nail_queen", photoUrl: null, points: 1450 },
  {
    rank: 2,
    name: "Поліна Гелєва",
    handle: "polish_master",
    photoUrl: null,
    points: 1320,
  },
  {
    rank: DEMO_PUBLIC_PROFILES["user-nail-perfection"].rank,
    id: "user-nail-perfection",
    name: DEMO_PUBLIC_PROFILES["user-nail-perfection"].name,
    handle: DEMO_PUBLIC_PROFILES["user-nail-perfection"].handle,
    photoUrl: DEMO_PUBLIC_PROFILES["user-nail-perfection"].photoUrl,
    points: DEMO_PUBLIC_PROFILES["user-nail-perfection"].points,
  },
  {
    rank: DEMO_PUBLIC_PROFILES["user-nataliia"].rank,
    id: "user-nataliia",
    name: DEMO_PUBLIC_PROFILES["user-nataliia"].name,
    handle: DEMO_PUBLIC_PROFILES["user-nataliia"].handle,
    photoUrl: DEMO_PUBLIC_PROFILES["user-nataliia"].photoUrl,
    points: DEMO_PUBLIC_PROFILES["user-nataliia"].points,
  },
  {
    rank: DEMO_PROFILE.rank,
    id: CURRENT_USER_ID,
    name: DEMO_PROFILE.name,
    handle: DEMO_PROFILE.handle,
    photoUrl: DEMO_PROFILE.avatarUrl ?? DEMO_PROFILE.photoUrl,
    points: DEMO_PROFILE.points,
  },
  {
    rank: DEMO_PUBLIC_PROFILES["user-olha-m"].rank,
    id: "user-olha-m",
    name: DEMO_PUBLIC_PROFILES["user-olha-m"].name,
    handle: DEMO_PUBLIC_PROFILES["user-olha-m"].handle,
    photoUrl: DEMO_PUBLIC_PROFILES["user-olha-m"].photoUrl,
    points: DEMO_PUBLIC_PROFILES["user-olha-m"].points,
  },
  {
    rank: DEMO_PUBLIC_PROFILES["user-beauty-nails"].rank,
    id: "user-beauty-nails",
    name: DEMO_PUBLIC_PROFILES["user-beauty-nails"].name,
    handle: DEMO_PUBLIC_PROFILES["user-beauty-nails"].handle,
    photoUrl: DEMO_PUBLIC_PROFILES["user-beauty-nails"].photoUrl,
    points: DEMO_PUBLIC_PROFILES["user-beauty-nails"].points,
  },
  {
    rank: DEMO_PUBLIC_PROFILES["user-kate"].rank,
    id: "user-kate",
    name: DEMO_PUBLIC_PROFILES["user-kate"].name,
    handle: DEMO_PUBLIC_PROFILES["user-kate"].handle,
    photoUrl: DEMO_PUBLIC_PROFILES["user-kate"].photoUrl,
    points: DEMO_PUBLIC_PROFILES["user-kate"].points,
  },
].sort((a, b) => a.rank - b.rank);

function buildLeaderboard(): LeaderboardUser[] {
  const byRank = new Map(ANCHORS.map((a) => [a.rank, a]));
  const result: LeaderboardUser[] = [];
  let fillerIndex = 0;

  for (let rank = 1; rank <= 100; rank++) {
    const anchor = byRank.get(rank);
    if (anchor) {
      result.push(anchor);
      continue;
    }

    const prev = [...ANCHORS].reverse().find((a) => a.rank < rank) ?? ANCHORS[0];
    const next = ANCHORS.find((a) => a.rank > rank);
    const points = next
      ? Math.round(
          prev.points +
            ((next.points - prev.points) * (rank - prev.rank)) / (next.rank - prev.rank),
        )
      : Math.max(0, prev.points - (rank - prev.rank) * 5);

    const base = FILLER_HANDLES[fillerIndex % FILLER_HANDLES.length];
    const cycle = Math.floor(fillerIndex / FILLER_HANDLES.length);
    const first = FILLER_FIRST_NAMES[fillerIndex % FILLER_FIRST_NAMES.length];
    const last = FILLER_LAST_NAMES[fillerIndex % FILLER_LAST_NAMES.length];
    fillerIndex++;

    result.push({
      rank,
      name: `${first} ${last}`,
      handle: cycle > 0 ? `${base}${cycle + 1}` : base,
      photoUrl: null,
      points,
    });
  }

  return result;
}

/** Топ-100 користувачів, місце 1–100, відсортовано за спаданням балів. */
export const LEADERBOARD: LeaderboardUser[] = buildLeaderboard();

/** Топ-3 для "п'єдесталу" (задача 0.10b.2). */
export const PODIUM = LEADERBOARD.slice(0, 3);

/** Місця 4–100 — таблиця рейтингу (задача 0.10b.3). */
export const LEADERBOARD_TABLE = LEADERBOARD.slice(3);
