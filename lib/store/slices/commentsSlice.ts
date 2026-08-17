import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Comment } from "@/lib/data/comments";
import type { Reaction } from "@/lib/progress/localComments";

/** Redux-дзеркало `lib/progress/localComments.ts` (власні коментарі + реакції гостя). */
interface CommentsState {
  /** Власні коментарі користувача, згруповані за slug-ом уроку. */
  commentsByLesson: Record<string, Comment[]>;
  hydratedLessons: Record<string, boolean>;
  reactions: Record<string, Reaction>;
  reactionsHydrated: boolean;
}

const initialState: CommentsState = {
  commentsByLesson: {},
  hydratedLessons: {},
  reactions: {},
  reactionsHydrated: false,
};

const commentsSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    lessonCommentsSet(
      state,
      action: PayloadAction<{ lessonSlug: string; comments: Comment[] }>,
    ) {
      const { lessonSlug, comments } = action.payload;
      state.commentsByLesson[lessonSlug] = comments;
      state.hydratedLessons[lessonSlug] = true;
    },
    reactionsSet(state, action: PayloadAction<Record<string, Reaction>>) {
      state.reactions = action.payload;
      state.reactionsHydrated = true;
    },
  },
});

export const { lessonCommentsSet, reactionsSet } = commentsSlice.actions;
export default commentsSlice.reducer;
