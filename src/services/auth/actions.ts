import { createAsyncThunk } from "@reduxjs/toolkit";
import { setUser } from "./slice";

export const AuthCheckUser = createAsyncThunk(
    'auth/checkUser',
    async (_, {rejectWithValue, dispatch}) => {
        try{
            const token = localStorage.getItem('post_token');

            if(!token){
                return rejectWithValue('Post token is missing');
            }

            const data: {user_id: number, access: string, refresh: string, permissions: string[]} = JSON.parse(atob(token));

            dispatch(setUser({
                id: data.user_id, 
                access: data.access, 
                refresh: data.refresh, 
                permissions: data.permissions
            }))

            return;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)
