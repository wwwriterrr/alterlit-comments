import { combineReducers, configureStore, type Reducer, type ThunkDispatch } from '@reduxjs/toolkit';
import AuthSlice, { type TAuthInternalActions } from './auth/slice';
import { useDispatch, useSelector, useStore } from 'react-redux';
import CommentsSlice from './comments/slice';

const rootReducer = combineReducers([
    AuthSlice,
    CommentsSlice,
].reduce((acc, reducer) => {
    acc[reducer.name] = reducer.reducer;
    return acc;
}, {} as { [key: string]: Reducer }));

export const store = configureStore({
    reducer: rootReducer,
})

type TAppActions = TAuthInternalActions

export type AppStore = typeof store;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, TAppActions>;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = () => useStore<AppStore>();
