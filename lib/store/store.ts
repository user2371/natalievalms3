import { configureStore } from "@reduxjs/toolkit";
import progressReducer from "@/lib/store/slices/progressSlice";
import homeworkReducer from "@/lib/store/slices/homeworkSlice";
import commentsReducer from "@/lib/store/slices/commentsSlice";
import settingsReducer from "@/lib/store/slices/settingsSlice";
import authModalReducer from "@/lib/store/slices/authModalSlice";
import progressSyncToastReducer from "@/lib/store/slices/progressSyncToastSlice";

/**
 * Глобальний стейт-менеджер проєкту — Redux Toolkit.
 *
 * Тут живе лише КРОС-СТОРІНКОВИЙ клієнтський стан, що раніше зберігався в
 * `localStorage` через набір самописних `useState`-хуків
 * (`lib/progress/useLocal*.ts`) і в React Context (`AuthModalContext`):
 * прогрес гостя, здані ДЗ, коментарі/реакції, налаштування видимості ДЗ,
 * стан модалки авторизації, тост Progress-sync при логіні (Фаза 7).
 *
 * ФАЗА HOME+ (29.08.2026): `featuredCourse`-slice ВИДАЛЕНО — вибір "курсу
 * на головній" (задача 0.20) тепер зберігається на сервері
 * (`modules/siteSettings`, `SiteSettings.featuredCourseId`), а не в
 * `localStorage`/Redux-кеші одного браузера (колишній
 * `lib/progress/localFeaturedCourse.ts`/`useFeaturedCourse.ts`, обидва
 * прибрані). `app/page.tsx` (Server Component) вантажить featured-курс
 * напряму й передає готовим пропом секціям лендінгу — жодного
 * крос-компонентного клієнтського стану для цього більше не потрібно.
 *
 * Суто локальний UI-стан окремих компонентів (значення полів форми,
 * відкритий/закритий dropdown, `loading` на кнопці) НАВМИСНО лишається на
 * звичайному `useState` — RTK для нього надлишковий, це не порушення
 * архітектури, а стандартна практика (глобальний стор — для стану, що
 * реально ділять кілька непов'язаних компонентів/сторінок).
 *
 * Кожен slice, як і раніше, синхронізується з `localStorage` через
 * відповідний `lib/progress/local*.ts`-модуль (не чіпали — вони й далі
 * єдине джерело правди для збереження між сесіями браузера); Redux-стор
 * тепер лише кеш цих даних у пам'яті на час життя вкладки, спільний для
 * всіх компонентів одразу, без повторного читання `localStorage` при
 * кожному переході між сторінками.
 */
export const store = configureStore({
  reducer: {
    progress: progressReducer,
    homework: homeworkReducer,
    comments: commentsReducer,
    settings: settingsReducer,
    authModal: authModalReducer,
    progressSyncToast: progressSyncToastReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
