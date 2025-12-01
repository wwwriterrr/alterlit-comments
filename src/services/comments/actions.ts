import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ApiURL } from "../../core/constants";
import { setComments, setCommentsAfterExist } from "./slice";

export const commentsWsConnect = createAction<string, 'FEED_CONNECT'>('FEED_CONNECT');

export const commentsWsDisconnect = createAction('FEED_DISCONNECT');

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

            const data: {comments: IComment[], after_exist: boolean} = await response.json();

            dispatch(setComments(data.comments));
            dispatch(setCommentsAfterExist(data.after_exist));

            return;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export type TCommentsWsExternalActions = ReturnType<typeof commentsWsConnect> | ReturnType<typeof commentsWsDisconnect>;
