import { createAsyncThunk } from "@reduxjs/toolkit";
import { setAuthCredentials, setUser } from "./slice";
import { ApiURL } from "../../core/constants";

const AuthGetPostToken = () => {
    const token = localStorage.getItem('post_token');

    if(!token) return null;

    const data: { user_id: number, access: string, refresh: string, perms: string[] } = JSON.parse(atob(token));

    return data;
}

const AuthSetPostToken = (access: string, refresh: string) => {
    const postToken = AuthGetPostToken();
    if(!postToken) return;

    const newPostToken = btoa(JSON.stringify({...postToken, access, refresh}));
    localStorage.setItem('post_token', newPostToken);
}

export const AuthCheckUser = createAsyncThunk(
    'auth/checkUser',
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const data = AuthGetPostToken();

            if (!data) {
                return rejectWithValue('Post token is missing');
            }

            dispatch(setUser({
                id: data.user_id,
                access: data.access,
                refresh: data.refresh,
                perms: data.perms
            }))

            return;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)

export const AuthRefreshToken = createAsyncThunk(
    'auth/refreshToken',
    async ({signal}: {signal?: AbortSignal}, { rejectWithValue, dispatch, getState }) => {
        try {
            const url = new URL(`${ApiURL}token/refresh/`);

            const state = getState() as { auth: { user: IAuthUser | null } };
            const refresh = state.auth.user?.refresh || '';

            if (!refresh) {
                return rejectWithValue('No refresh token');
            }

            const response = await fetch(url, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ refresh }),
                signal,
            })

            if(!response.ok){
                return rejectWithValue('Error with refresh token');
            }

            const data: {access: string, refresh: string} = await response.json();

            dispatch(setAuthCredentials({access: data.access, refresh: data.refresh}));

            AuthSetPostToken(data.access, data.refresh);

            return;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)
