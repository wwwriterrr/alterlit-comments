import { createAsyncThunk } from "@reduxjs/toolkit";
import { ApiURL } from "../../core/constants";
import { setComments } from "./slice";

export const CommentsFetch = createAsyncThunk(
    'comments/fetch',
    async ({type='post', instanceId, signal}: {instanceId: string, type: string, signal: AbortSignal}, {rejectWithValue, dispatch}) => {
        try {
            const url = new URL(`${ApiURL}comments/${type}/${instanceId}/`);

            const response = await fetch(url, {
                signal,
            });

            if (!response.ok) {
                return rejectWithValue('Failed to fetch comments');
            }

            const data: {comments: IComment[]} = await response.json();

            dispatch(setComments(data.comments));

            return;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);
