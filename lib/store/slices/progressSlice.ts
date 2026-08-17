import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CourseProgressMap } from "@/lib/progress/localProgress";

/**
 * Redux-дзеркало `lib/progress/localProgress.ts` (прогрес гостя).
 *
 * Два незалежні шматки стану:
 * - `completedSlugs`/`hydrated` — легасі, для `useLocalProgress()` (єдиний
 *   статичний курс, `Set<slug>`-API, не чіпали під час переходу на нову
 *   namespaced-структуру сховища, 25.07.2026, Фаза 5).
 * - `byCourse`/`hydratedCourses` — нове (задача 5.7), для `useProgress(courseId)`:
 *   мапа `courseId → { lessonId → { completed, quizScore, quizTotal, updatedAt } }`,
 *   підтримує довільну кількість курсів одночасно (задача 5.13).
 *
 * `completedSlugs`/`byCourse` — навмисно не `Set`/не з вкладеними класами:
 * Redux state має лишатись серіалізовним (інакше `serializableCheck`
 * мідлвари RTK видасть попередження); хуки конвертують на межі.
 */
interface ProgressState {
  completedSlugs: string[];
  hydrated: boolean;

  byCourse: Record<string, CourseProgressMap>;
  hydratedCourses: Record<string, boolean>;
}

const initialState: ProgressState = {
  completedSlugs: [],
  hydrated: false,

  byCourse: {},
  hydratedCourses: {},
};

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    /** Легасі: підвантажує реальні дані з `localStorage` (викликається один раз у `useEffect`). */
    progressHydrated(state, action: PayloadAction<string[]>) {
      state.completedSlugs = action.payload;
      state.hydrated = true;
    },
    /** Легасі: позначає урок пройденим (сам запис у `localStorage` лишається в `localProgress.ts`). */
    lessonMarkedComplete(state, action: PayloadAction<string>) {
      if (!state.completedSlugs.includes(action.payload)) {
        state.completedSlugs.push(action.payload);
      }
    },

    /** 5.7: підвантажує прогрес конкретного курсу з `localStorage`. */
    courseProgressHydrated(
      state,
      action: PayloadAction<{ courseId: string; progress: CourseProgressMap }>,
    ) {
      state.byCourse[action.payload.courseId] = action.payload.progress;
      state.hydratedCourses[action.payload.courseId] = true;
    },
    /** 5.7: оновлює прогрес курсу (після `setLessonCompleted`/`setQuizResult`). */
    courseProgressUpdated(
      state,
      action: PayloadAction<{ courseId: string; progress: CourseProgressMap }>,
    ) {
      state.byCourse[action.payload.courseId] = action.payload.progress;
    },
  },
});

export const {
  progressHydrated,
  lessonMarkedComplete,
  courseProgressHydrated,
  courseProgressUpdated,
} = progressSlice.actions;
export default progressSlice.reducer;
