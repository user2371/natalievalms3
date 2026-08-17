import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LocalHomeworkSubmission } from "@/lib/progress/localHomework";

/** Redux-дзеркало `lib/progress/localHomework.ts` (здані відео ДЗ гостя). */
interface HomeworkState {
  submissions: LocalHomeworkSubmission[];
  hydrated: boolean;
}

const initialState: HomeworkState = {
  submissions: [],
  hydrated: false,
};

const homeworkSlice = createSlice({
  name: "homework",
  initialState,
  reducers: {
    homeworkHydrated(state, action: PayloadAction<LocalHomeworkSubmission[]>) {
      state.submissions = action.payload;
      state.hydrated = true;
    },
    /**
     * Список приходить уже повністю перерахованим з `saveLocalHomeworkSubmission`
     * (найновіші перші, без дублю по `lessonSlug`) — той самий підхід, що і
     * в старому `useState`-хуку, лише джерело правди тепер store, а не
     * локальний компонентний стан.
     */
    homeworkSubmissionsUpdated(state, action: PayloadAction<LocalHomeworkSubmission[]>) {
      state.submissions = action.payload;
    },
  },
});

export const { homeworkHydrated, homeworkSubmissionsUpdated } = homeworkSlice.actions;
export default homeworkSlice.reducer;
