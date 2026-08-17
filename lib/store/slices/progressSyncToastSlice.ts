import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * `lib/store/slices/progressSyncToastSlice.ts` (задача 7.11) — тост
 * "Прогрес синхронізовано" (і повідомлення про помилку sync, задача
 * 7.12) після мержу `localStorage` → БД при логіні/реєстрації. Той самий
 * підхід, що й `authModalSlice.ts`: глобальний UI-стан, який пише
 * `lib/progress/useProgressSync.ts`, а читає (і рендерить) один компонент
 * у корені дерева (`components/progress/ProgressSyncToast.tsx`) — типовий
 * кандидат на RTK, а не локальний `useState`.
 */

export type ProgressSyncToastVariant = "success" | "error";

interface ProgressSyncToastState {
  message: string | null;
  variant: ProgressSyncToastVariant;
}

const initialState: ProgressSyncToastState = {
  message: null,
  variant: "success",
};

const progressSyncToastSlice = createSlice({
  name: "progressSyncToast",
  initialState,
  reducers: {
    progressSyncToastShown(
      state,
      action: PayloadAction<{ message: string; variant: ProgressSyncToastVariant }>,
    ) {
      state.message = action.payload.message;
      state.variant = action.payload.variant;
    },
    progressSyncToastDismissed(state) {
      state.message = null;
    },
  },
});

export const { progressSyncToastShown, progressSyncToastDismissed } =
  progressSyncToastSlice.actions;
export default progressSyncToastSlice.reducer;
