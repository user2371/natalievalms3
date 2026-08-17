// `modules/quizzes/index.ts` (задача 6.8) — публічний експорт модуля.
// UI-компоненти та сторінки (`app/**`) імпортують ТІЛЬКИ звідси, ніколи
// напряму з `repository.ts`/`service.ts` (правило з `CLAUDE.md`, розділ
// "Архітектура модулів").

export {
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
  reorderQuestionsAction,
  submitQuizAnswerAction,
  submitQuizResultAction,
} from "./actions";
export {
  getQuizByLessonIdService,
  getQuestionByIdService,
  getQuizQuestionsForLessonService,
  checkAnswerService,
  calculateQuizScoreService,
} from "./service";
export {
  CreateQuestionSchema,
  UpdateQuestionSchema,
  ReorderQuestionsSchema,
  SubmitAnswerSchema,
  SubmitQuizResultSchema,
} from "./schema";
export type {
  Quiz,
  Question,
  Answer,
  CreateQuestionInput,
  UpdateQuestionInput,
  ReorderQuestionsInput,
  SubmitAnswerInput,
  SubmitQuizResultInput,
} from "./schema";
