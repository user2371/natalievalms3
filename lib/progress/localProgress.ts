/**
 * Прогрес гостя (без реєстрації) — зберігається у `localStorage` браузера.
 * Задокументовано в `CLAUDE.md`: "Гість може проходити курс без реєстрації.
 * Прогрес гостя — у localStorage".
 *
 * 25.07.2026, Фаза 5 (задачі 5.1–5.6, 5.14, 5.17): структуру переписано з
 * плаского `Set<slug>` на namespaced-за-курсом мапу з результатом квізу —
 * `{ [courseId]: { [lessonId]: { completed, quizScore, quizTotal, updatedAt } } }`.
 * Стара функція `markLessonCompleteLocally`/`getLocalCompletedSlugs`
 * (плаский `Set`) прибрана — `lib/progress/useLocalProgress.ts` (легасі-хук
 * для єдиного статичного курсу) тепер бере дані звідси через
 * `getLocalProgress`/`setLessonCompleted` з фіксованим `courseId`, тож
 * зовнішній API того хука для 6 існуючих сторінок-споживачів НЕ змінився.
 *
 * При логіні/реєстрації (Фаза 7, `modules/progress.syncLocalProgressAction`,
 * викликається з `lib/progress/useProgressSync.ts`) дані звідси одноразово
 * мерджаться у БД, після чого `localStorage` очищається (`clearLocalProgress`).
 *
 * Це чистий клієнтський модуль (без "use server"), нічого не знає про
 * авторизованого користувача — сторінки самі вирішують, який шар прогресу
 * показувати.
 */

const STORAGE_KEY = "natalieva:progress:v2";
// Версія формату (задача 5.14) — якщо колись знадобиться ще раз змінити
// структуру, досить збільшити цю константу: `readStorage` тихо скидає
// прогрес при розбіжності версій замість падіння на несумісних даних.
const STORAGE_VERSION = 2;

export interface LessonProgressEntry {
  completed: boolean;
  quizScore: number | null;
  quizTotal: number | null;
  /** ISO-рядок (не `Date` — має лишатись JSON-серіалізовним). */
  updatedAt: string;
}

/** lessonId → прогрес по цьому уроку, у межах одного курсу. */
export type CourseProgressMap = Record<string, LessonProgressEntry>;

/** courseId → мапа прогресу уроків цього курсу (задача 5.13 — кілька курсів одночасно). */
type StoredCourses = Record<string, CourseProgressMap>;

interface StoredProgressEnvelope {
  version: number;
  courses: StoredCourses;
}

// Фабрика, а НЕ спільна константа: `setLessonCompleted`/`setQuizResult`
// мутують `envelope.courses[...]` на отриманому з `readStorage()` об'єкті
// перед записом назад у `localStorage` — якби тут була одна спільна
// константа-об'єкт, кожен виклик `setLessonCompleted` після "порожнього"
// стану (нема даних / пошкоджений JSON / несумісна версія) назавжди
// "забруднював" би цю константу чужими даними для всіх наступних викликів
// у межах того самого завантаження сторінки (знайдено реальним тестом
// логіки цього файлу — не гіпотетичний випадок).
function createEmptyEnvelope(): StoredProgressEnvelope {
  return { version: STORAGE_VERSION, courses: {} };
}

function readStorage(): StoredProgressEnvelope {
  // Задача 5.6: localStorage доступний лише client-side.
  if (typeof window === "undefined") return createEmptyEnvelope();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyEnvelope();

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as { version?: unknown }).version !== STORAGE_VERSION
    ) {
      // Пошкоджені дані або несумісна версія формату (задача 5.14) —
      // тихо скидаємо, без падіння застосунку.
      return createEmptyEnvelope();
    }

    const courses = (parsed as { courses?: unknown }).courses;
    return {
      version: STORAGE_VERSION,
      courses:
        typeof courses === "object" && courses !== null ? (courses as StoredCourses) : {},
    };
  } catch {
    // Задача 5.17: localStorage недоступний (приватний режим тощо) або
    // пошкоджений JSON — тихо деградуємо до порожнього стану.
    return createEmptyEnvelope();
  }
}

function writeStorage(envelope: StoredProgressEnvelope) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // Задача 5.17: localStorage недоступний — тихо ігноруємо, прогрес
    // просто не збережеться (застосунок не падає).
  }
}

/** 5.2: Повертає мапу прогресу уроків для одного конкретного курсу. */
export function getLocalProgress(courseId: string): CourseProgressMap {
  return readStorage().courses[courseId] ?? {};
}

/**
 * Задача 7.6: повертає ВЕСЬ локальний прогрес одразу, по всіх курсах
 * (`{ [courseId]: { [lessonId]: entry } }`) — для sync-хука
 * (`lib/progress/useProgressSync.ts`), якому потрібно відправити на
 * сервер прогрес одразу з усіх курсів гостя, а не лише одного.
 */
export function getAllLocalProgress(): StoredCourses {
  return readStorage().courses;
}

/**
 * 5.3: Позначає урок пройденим (не займаючи наявний `quizScore`/`quizTotal`,
 * якщо вони вже були збережені раніше через `setQuizResult`). Повертає
 * оновлену мапу прогресу цього курсу.
 */
export function setLessonCompleted(
  courseId: string,
  lessonId: string,
): CourseProgressMap {
  const envelope = readStorage();
  const courseProgress = envelope.courses[courseId] ?? {};
  const existing = courseProgress[lessonId];

  courseProgress[lessonId] = {
    completed: true,
    quizScore: existing?.quizScore ?? null,
    quizTotal: existing?.quizTotal ?? null,
    updatedAt: new Date().toISOString(),
  };
  envelope.courses[courseId] = courseProgress;
  writeStorage(envelope);
  return courseProgress;
}

/**
 * 5.4: Зберігає результат проходження квізу уроку. Квіз — завжди останній
 * крок уроку (задокументовано в `CLAUDE.md`), тож збереження результату
 * заодно позначає урок пройденим.
 */
export function setQuizResult(
  courseId: string,
  lessonId: string,
  score: number,
  total: number,
): CourseProgressMap {
  const envelope = readStorage();
  const courseProgress = envelope.courses[courseId] ?? {};

  courseProgress[lessonId] = {
    completed: true,
    quizScore: score,
    quizTotal: total,
    updatedAt: new Date().toISOString(),
  };
  envelope.courses[courseId] = courseProgress;
  writeStorage(envelope);
  return courseProgress;
}

/** 5.5: Використовується після one-time merge у БД при логіні/реєстрації (Фаза 7). Очищає ВЕСЬ локальний прогрес (усі курси). */
export function clearLocalProgress() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ігноруємо (5.17)
  }
}
