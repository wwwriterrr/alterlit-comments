import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { AuthCheckUser } from './actions';

interface IInitialState {
    user: IAuthUser | null;
    authChecked: boolean;
}

const initialState: IInitialState = {
    user: null,
    authChecked: false,
};

const AuthSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
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
    },
    extraReducers: (builder) => {
        builder
            .addCase(AuthCheckUser.pending, (state) => {
                state.authChecked = false;
            })
            .addCase(AuthCheckUser.fulfilled, (state) => {
                state.authChecked = true;
            })
            .addCase(AuthCheckUser.rejected, (state) => {
                state.authChecked = true;
            })
    }
});

export const {
    setUser,
    setAuthCredentials,
    logout
} = AuthSlice.actions;

export const {
    getAccessToken,
    getRefreshToken,
    getUser,
    getAuthChecked,
} = AuthSlice.selectors;

export default AuthSlice;

export type TAuthInternalActions = ReturnType<typeof AuthSlice.actions[keyof typeof AuthSlice.actions]>;
