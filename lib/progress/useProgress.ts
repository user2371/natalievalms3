"use client";

import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  courseProgressHydrated,
  courseProgressUpdated,
} from "@/lib/store/slices/progressSlice";
import {
  getLocalProgress,
  setLessonCompleted,
  setQuizResult,
  type CourseProgressMap,
} from "@/lib/progress/localProgress";
import { getCourseProgressAction, syncLocalProgressAction } from "@/modules/progress";

export interface UseProgressResult {
  /** lessonId → прогрес по уроку (`completed`, `quizScore`, `quizTotal`, `updatedAt`). */
  progress: CourseProgressMap;
  /** Чи прогрес уже підвантажений (щоб уникнути "миготіння" до гідратації). */
  hydrated: boolean;
  markLessonCompleted: (lessonId: string) => void;
  markQuizResult: (lessonId: string, score: number, total: number) => void;
}

/**
 * Уніфікований хук прогресу курсу (задача 5.7) — єдиний інтерфейс,
 * призначений для сторінок з реальними (Prisma) курсами/уроками
 * (`/courses/[slug]`, `/courses/[slug]/lessons/[lessonId]`, задачі
 * 5.8–5.12). На відміну від легасі `useLocalProgress()` (єдиний
 * захардкоджений статичний курс), параметризований довільним `courseId` —
 * підтримує кілька курсів одночасно "з коробки" (задача 5.13, через
 * `progressSlice.byCourse`).
 *
 * **Fixes/F.11 (04.08.2026): реальне серверне читання для залогінених
 * тепер Є.** До цього фіксу докстрінг тут стверджував, що Фаза 7 ще не
 * реалізована — це стало неправдою відколи Фаза 7 закрилась, але сам хук
 * так і лишався виключно на `localStorage`, тож для вже залогіненого
 * користувача (не в момент самого логіну — `useProgressSync` спрацьовує
 * рівно раз) UI ніколи не бачив реального прогресу з БД: сайдбар/картки
 * курсу завжди показували 0% (`getLocalProgress` — порожній після
 * `clearLocalProgress` при попередньому логіні), а `markLessonCompleted`
 * писав ЛИШЕ в `localStorage`, нічого не відправляючи на сервер — бали
 * (`modules/points`, через `syncLocalProgressService`, F.10) відповідно
 * ніколи не нараховувались за цю дію для вже залогіненого юзера.
 *
 * **Fixes/F.13 (04.08.2026): усунуто race condition при client-side навігації.**
 * F.11/F.12 використовували ДВА окремі `useEffect` — "гостьовий" (спрацьовує,
 * якщо `!isAuthenticated`) і "авторизований" (спрацьовує, якщо
 * `isAuthenticated`). Проблема: `useSession()` має ТРИ стани, не два —
 * `"loading"` теж `!== "authenticated"`, тож поки статус сесії ще не
 * встиг остаточно визначитись (короткий момент одразу після монтування,
 * особливо помітно при client-side переході між сторінками уроків, коли
 * компонент перемонтовується, а `SessionProvider` ще не встиг підтвердити
 * сесію знову), "гостьовий" ефект встигав ПЕРШИМ хибно гідратувати курс
 * ПОРОЖНІМ `localStorage` і позначити `hydratedCourses[courseId] = true`.
 * Коли статус усе ж таки доходив до `"authenticated"`, другий ефект мав
 * перезаписати дані правильними — здебільшого встигав, але саме на
 * client-side навігації (на відміну від повного `F5`, де обидва ефекти й
 * так стартують "з нуля" по-новому і встигають синхронізуватись) вікно
 * гонки давало собі знати: користувач бачив сайдбар з "0 пройдених уроків"
 * до наступного повного перезавантаження сторінки.
 *
 * Тепер — ОДИН ефект, що взагалі нічого не робить, поки `status === "loading"`
 * (чекає на остаточний результат), і лише тоді обирає рівно одну гілку
 * (гість/залогінений) — жодного проміжного хибного стану, який довелось би
 * потім перезаписувати.
 *
 * **Fixes/F.14 (04.08.2026): клік більше не "скидає" сайдбар.**
 * `markLessonCompleted`/`markQuizResult` раніше диспатчили в Redux РІВНО те,
 * що повернули `setLessonCompleted`/`setQuizResult` — а ці функції читають
 * ЛИШЕ `localStorage` і повертають ЛИШЕ те, що там є. Для залогіненого
 * юзера `localStorage` майже завжди порожній (реальний прогрес — у БД,
 * F.11), тож такий dispatch переписував Redux "мапою з одного щойно
 * клікнутого уроку", стираючи з екрана все, що раніше підтягнулось із
 * сервера (сайдбар "скидався" до порожнього/локального стану одразу після
 * кліку). Тепер мержимо з ПОТОЧНИМ `progress` (уже в Redux, включно з
 * серверними даними) — оновлюємо лише той один урок, що клікнули.
 */
export function useProgress(courseId: string): UseProgressResult {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const dispatch = useAppDispatch();
  const progress = useAppSelector((state) => state.progress.byCourse[courseId] ?? {});
  const hydrated = useAppSelector(
    (state) => state.progress.hydratedCourses[courseId] ?? false,
  );

  useEffect(() => {
    // Fixes/F.13: поки статус сесії остаточно не визначився — НІЧОГО не
    // робимо (ні гостьової, ні серверної гідратації). Це і є фікс гонки:
    // раніше "гостьова" гілка спрацьовувала тут (бо `status !== "authenticated"`
    // включало й `"loading"`), а потім її доводилось перезаписувати.
    if (status === "loading") return;

    if (status === "unauthenticated") {
      dispatch(courseProgressHydrated({ courseId, progress: getLocalProgress(courseId) }));
      return;
    }

    // status === "authenticated" — реальні дані з БД, змерджені з будь-яким
    // залишком `localStorage` (на випадок, коли sync-після-логіну ще не
    // встиг відпрацювати — "completed: true" перемагає, той самий принцип,
    // що й у `mergeProgress` на сервері).
    let cancelled = false;
    (async () => {
      let merged: CourseProgressMap;
      try {
        const serverProgress = await getCourseProgressAction(courseId);
        const localProgress = getLocalProgress(courseId);

        merged = { ...serverProgress };
        for (const [lessonId, entry] of Object.entries(localProgress)) {
          const existing = merged[lessonId];
          if (!existing || (entry.completed && !existing.completed)) {
            merged[lessonId] = entry;
          }
        }
      } catch (err) {
        // Fixes/F.12: fallback — при будь-якій помилці на клієнті не
        // залишаємо `hydrated` зависати, а падаємо на `localStorage`.
        console.error("Не вдалося підвантажити прогрес курсу:", err);
        merged = getLocalProgress(courseId);
      }

      if (cancelled) return;
      dispatch(courseProgressHydrated({ courseId, progress: merged }));
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, status, dispatch]);

  const markLessonCompleted = useCallback(
    (lessonId: string) => {
      const localNext = setLessonCompleted(courseId, lessonId);
      // Fixes/F.14: НЕ `dispatch(nextProgress)` напряму — `localNext`
      // (повернене з `setLessonCompleted`) містить ЛИШЕ те, що вже було в
      // `localStorage`, а для залогіненого юзера там майже завжди порожньо
      // (реальний прогрес живе в БД, F.11). Прямий dispatch стирав з Redux
      // усі раніше підтягнуті з сервера уроки — сайдбар "скидався" до
      // локального стану. Мержимо з ПОТОЧНИМ `progress` (те, що вже в
      // Redux, включно з серверними даними) — оновлюємо лише цей урок.
      const mergedProgress: CourseProgressMap = {
        ...progress,
        [lessonId]: localNext[lessonId],
      };
      dispatch(courseProgressUpdated({ courseId, progress: mergedProgress }));

      if (isAuthenticated) {
        const entry = mergedProgress[lessonId];
        // Best-effort — той самий принцип, що й у `RealQuizBlock`: не
        // блокуємо UI очікуванням мережі, і не валимо взаємодію користувача
        // при мережевій помилці (localStorage-запис вище вже стався,
        // наступний логін-sync або повторний клік підхоплять пізніше).
        void syncLocalProgressAction({
          entries: [
            {
              courseId,
              lessonId,
              completed: entry.completed,
              quizScore: entry.quizScore,
              quizTotal: entry.quizTotal,
              updatedAt: entry.updatedAt,
            },
          ],
        }).catch(() => {
          // Best-effort (див. докстрінг вище) — мережева помилка тут не
          // повинна ламати UI, той самий принцип, що й у `RealQuizBlock`.
        });
      }
    },
    [courseId, dispatch, isAuthenticated, progress],
  );

  const markQuizResult = useCallback(
    (lessonId: string, score: number, total: number) => {
      const localNext = setQuizResult(courseId, lessonId, score, total);
      // Fixes/F.14: той самий фікс, що й у `markLessonCompleted` вище —
      // мержимо з поточним Redux-станом, а не переписуємо його повністю
      // тим, що повернув локальний запис.
      const mergedProgress: CourseProgressMap = {
        ...progress,
        [lessonId]: localNext[lessonId],
      };
      dispatch(courseProgressUpdated({ courseId, progress: mergedProgress }));
    },
    [courseId, dispatch, progress],
  );

  return { progress, hydrated, markLessonCompleted, markQuizResult };
}
