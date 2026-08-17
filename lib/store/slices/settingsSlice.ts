import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** Redux-дзеркало `lib/progress/localSettings.ts` (видимість ДЗ на публічному профілі). */
interface SettingsState {
  homeworkVisible: boolean;
  hydrated: boolean;
}

const initialState: SettingsState = {
  homeworkVisible: true,
  hydrated: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    homeworkVisibilityHydrated(state, action: PayloadAction<boolean>) {
      state.homeworkVisible = action.payload;
      state.hydrated = true;
    },
    homeworkVisibilityChanged(state, action: PayloadAction<boolean>) {
      state.homeworkVisible = action.payload;
    },
  },
});

export const { homeworkVisibilityHydrated, homeworkVisibilityChanged } =
  settingsSlice.actions;
export default settingsSlice.reducer;
