import { combineReducers, configureStore, type Reducer, type ThunkDispatch } from '@reduxjs/toolkit';
import AuthSlice, { type TAuthInternalActions } from './auth/slice';
import { 
    useDispatch, 
    useSelector, 
    useStore 
} from 'react-redux';
import CommentsSlice, { 
    wsClose, 
    wsConnecting, 
    wsError, 
    wsMessage, 
    wsOpen, 
    type TCommentsInternalActions 
} from './comments/slice';
import { socketMiddleware } from './middleware';
import { 
    commentsWsConnect, 
    commentsWsDisconnect, 
    type TCommentsWsExternalActions 
} from './comments/actions';
import { ModalSlice, type TModalInternalActions } from './modal/slice';
import type { TViewerInternalActions } from './viewer/slice';
import ViewerSlice from './viewer/slice';

const commentsMiddleware = socketMiddleware<unknown, IWsMessage>({
    connect: commentsWsConnect,
    disconnect: commentsWsDisconnect,
    onConnecting: wsConnecting,
    onOpen: wsOpen,
    onClose: wsClose,
    onError: wsError,
    onMessage: wsMessage,
})

const rootReducer = combineReducers([
    AuthSlice,
    CommentsSlice,
    ModalSlice,
    ViewerSlice,
].reduce((acc, reducer) => {
    acc[reducer.name] = reducer.reducer;
    return acc;
}, {} as { [key: string]: Reducer }));

export const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }).concat(commentsMiddleware)
})

type TAppActions = TAuthInternalActions
    | TCommentsInternalActions
    | TCommentsWsExternalActions
    | TModalInternalActions
    | TViewerInternalActions

export type AppStore = typeof store;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ThunkDispatch<RootState, unknown, TAppActions>;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = () => useStore<AppStore>();
