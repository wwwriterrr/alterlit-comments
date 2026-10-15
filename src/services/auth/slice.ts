import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { AuthCheckUser, CommentsFetchPerms } from './actions';

interface IInitialState {
    perms: TCommentsPerms,
    permsChecked: boolean,
    user: IAuthUser | null;
    authChecked: boolean;
}

const initialState: IInitialState = {
    // читать можно, пока список не ответил иначе; писать — пока не пришли права
    perms: {
        comments_list: true,
        comments_list_detail: '',
        comments_send: false,
        comments_send_detail: '',
    },
    permsChecked: false,
    user: null,
    authChecked: false,
};

const AuthSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCommentsPerms: (state, action: PayloadAction<TCommentsPerms>) => {
            state.perms = action.payload;
        },
        setUser: (state, action: PayloadAction<IAuthUser>) => {
            state.user = action.payload;
        },
        /** Список комментариев ответил отказом (закрыты, публикация недоступна). */
        setCommentsListDenied: (state, action: PayloadAction<string>) => {
            state.perms.comments_list = false;
            state.perms.comments_list_detail = action.payload;
        },
        logout: (state) => {
            state.user = null;
        },
    },
    selectors: {
        getAuthChecked: state => state.authChecked,
        getUser: state => state.user,
        getCommentsPerms: state => state.perms,
        getCommentsPermsChecked: state => state.permsChecked,
    },
    extraReducers: (builder) => {
        builder
            .addCase(AuthCheckUser.pending, (state) => {
                state.permsChecked = false;
                state.authChecked = false;
            })
            .addCase(AuthCheckUser.fulfilled, (state, action) => {
                state.user = action.payload;
                state.authChecked = true;
                if (!action.payload) {
                    // аноним: права не запрашиваем — сразу «войдите»
                    state.perms.comments_send = false;
                    state.perms.comments_send_detail = 'Чтобы оставлять комментарии, войдите на сайт.';
                    state.permsChecked = true;
                }
            })
            .addCase(AuthCheckUser.rejected, (state) => {
                state.authChecked = true;
                state.permsChecked = true;
                state.perms.comments_send = false;
                state.perms.comments_send_detail = 'Не удалось проверить вход на сайт. Обновите страницу.';
            })
            .addCase(CommentsFetchPerms.fulfilled, (state, action) => {
                state.perms.comments_send = action.payload.can_send;
                state.perms.comments_send_detail = action.payload.send_reason || '';
                if (state.user) state.user.perms = action.payload.is_moderator ? ['admin'] : [];
                state.permsChecked = true;
            })
            .addCase(CommentsFetchPerms.rejected, (state, action) => {
                state.perms.comments_send = false;
                state.perms.comments_send_detail = action.payload || 'Не удалось проверить права на комментарии.';
                state.permsChecked = true;
            })
    }
});

export const {
    setCommentsPerms,
    setUser,
    setCommentsListDenied,
    logout
} = AuthSlice.actions;

export const {
    getCommentsPerms,
    getCommentsPermsChecked,
    getUser,
    getAuthChecked,
} = AuthSlice.selectors;

export default AuthSlice;

export type TAuthInternalActions = ReturnType<typeof AuthSlice.actions[keyof typeof AuthSlice.actions]>;
