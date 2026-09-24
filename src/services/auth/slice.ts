import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { AuthCheckUser } from './actions';

interface IInitialState {
    perms: TCommentsPerms,
    permsChecked: boolean,
    user: IAuthUser | null;
    authChecked: boolean;
}

const initialState: IInitialState = {
    perms: {
        comments_list: false,
        comments_list_detail: 'Непредвиденная ошибка',  
        comments_send: false,
        comments_send_detail: 'Непредвиденная ошибка',
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
        setAuthCredentials: (state, action: PayloadAction<{ access: string, refresh: string }>) => {
            if(state.user){
                const { access, refresh } = action.payload;
                state.user.access = access;
                state.user.refresh = refresh;
            }
        },
        logout: (state) => {
            state.user = null;
        },
    },
    selectors: {
        getAuthChecked: state => state.authChecked,
        getAccessToken: state => state.user?.access,
        getRefreshToken: state => state.user?.refresh,
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
            .addCase(AuthCheckUser.fulfilled, (state) => {
                state.permsChecked = true;
                state.authChecked = true;
            })
            .addCase(AuthCheckUser.rejected, (state) => {
                state.permsChecked = true;
                state.authChecked = true;
            })
    }
});

export const {
    setCommentsPerms,
    setUser,
    setAuthCredentials,
    logout
} = AuthSlice.actions;

export const {
    getCommentsPerms,
    getCommentsPermsChecked,
    getAccessToken,
    getRefreshToken,
    getUser,
    getAuthChecked,
} = AuthSlice.selectors;

export default AuthSlice;

export type TAuthInternalActions = ReturnType<typeof AuthSlice.actions[keyof typeof AuthSlice.actions]>;
