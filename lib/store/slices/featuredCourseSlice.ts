import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * Redux-дзеркало `lib/progress/localFeaturedCourse.ts` (вибір адміна, який
 * курс показувати на лендінгу). Зберігається лише `slug` — сам об'єкт
 * `Course` резолвиться в хуку `useFeaturedCourse` (`lib/data/courses.ts`
 * — статичні дані, не мають лежати в Redux state вдруге).
 */
interface FeaturedCourseState {
  slug: string | null;
  hydrated: boolean;
}

const initialState: FeaturedCourseState = {
  slug: null,
  hydrated: false,
};

const featuredCourseSlice = createSlice({
  name: "featuredCourse",
  initialState,
  reducers: {
    featuredCourseHydrated(state, action: PayloadAction<string | null>) {
      state.slug = action.payload;
      state.hydrated = true;
    },
    featuredCourseChanged(state, action: PayloadAction<string>) {
      state.slug = action.payload;
    },
  },
});

export const { featuredCourseHydrated, featuredCourseChanged } =
  featuredCourseSlice.actions;
export default featuredCourseSlice.reducer;
