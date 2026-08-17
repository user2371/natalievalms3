import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { AppDispatch, RootState } from "@/lib/store/store";

/**
 * Типізовані обгортки над `useDispatch`/`useSelector` (стандартна практика
 * Redux Toolkit + TypeScript) — використовувати замість "голих" хуків з
 * `react-redux` у всьому проєкті, щоб не губити типи `RootState`/`AppDispatch`.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
