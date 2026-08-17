import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthScreen } from "@/components/auth/AuthModal";

/**
 * Раніше жив у React Context (`components/auth/AuthModalContext.tsx`,
 * `useState` + `createContext`). Це глобальний UI-стан (один екран модалки
 * авторизації на весь застосунок, читають/пишуть 6 різних компонентів —
 * `Header`, `GuestGate`, `CommentsBlock`, `HomeworkBlock`,
 * `AuthModalAutoOpen`), тому природний кандидат на RTK, а не локальний
 * `useState` одного компонента.
 */
interface AuthModalState {
  screen: AuthScreen | null;
}

const initialState: AuthModalState = {
  screen: null,
};

const authModalSlice = createSlice({
  name: "authModal",
  initialState,
  reducers: {
    authModalScreenSet(state, action: PayloadAction<AuthScreen | null>) {
      state.screen = action.payload;
    },
  },
});

export const { authModalScreenSet } = authModalSlice.actions;
export default authModalSlice.reducer;
