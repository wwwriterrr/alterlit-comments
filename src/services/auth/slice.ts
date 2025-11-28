import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface IInitialState {
    access: string | null;
    refresh: string | null;
}

const initialState: IInitialState = {
    access: null,
    refresh: null,
};

const AuthSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthCredentials: (state, action: PayloadAction<{ access: string, refresh: string }>) => {
            const { access, refresh } = action.payload;
            state.access = access;
            state.refresh = refresh;
        },
        logout: (state) => {
            state.access = null;
            state.refresh = null;
        },
    },
    selectors: {
        getAccessToken: state => state.access,
        getRefreshToken: state => state.refresh,
    }
});

export const {
    setAuthCredentials,
    logout
} = AuthSlice.actions;

export const {
    getAccessToken,
    getRefreshToken,
} = AuthSlice.selectors;

export default AuthSlice;

export type TAuthInternalActions = ReturnType<typeof AuthSlice.actions[keyof typeof AuthSlice.actions]>;
