import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ApiURL } from "../../core/constants";
import { setComments, setCommentsAfterExist } from "./slice";

export const commentsWsConnect = createAction<string, 'FEED_CONNECT'>('FEED_CONNECT');

export const commentsWsDisconnect = createAction('FEED_DISCONNECT');

export const CommentsFetch = createAsyncThunk(
    'comments/fetch',
    async ({ type = 'post', instanceId, signal }: { instanceId: string, type: string, signal: AbortSignal }, { rejectWithValue, dispatch }) => {
        try {
            const url = new URL(`${ApiURL}comments/${type}/${instanceId}/`);

            const response = await fetch(url, {
                signal,
            });

            if (!response.ok) {
                return rejectWithValue('Failed to fetch comments');
            }

            const data: { comments: IComment[], after_exist: boolean } = await response.json();

            dispatch(setComments(data.comments));
            dispatch(setCommentsAfterExist(data.after_exist));

            return;
        } catch (error) {
            return rejectWithValue(error);
        }
    }
);

export const CommentsSend = createAsyncThunk(
    'comments/send',
    async ({ instanceId, type = 'post', content, replyTo, editId, images = [] }: {
        instanceId: string;
        type: string;
        content: string;
        replyTo?: number;
        editId?: number;
        images?: number[];
    }, { rejectWithValue, getState }) => {
        try {
            let url = new URL(`${ApiURL}comments/${type}/${instanceId}/`);
            if (editId) url = new URL(`${ApiURL}comment/${editId}/`);

            const state = getState() as { auth: { user: IAuthUser | null } };
            const token = state.auth.user?.access || '';

            if (!token) {
                return rejectWithValue('No auth token');
            }

            const bodyData: { content: string, reply_to?: number, edit_id?: number, images: number[] } = { content, images: [] };
            if (replyTo) bodyData['reply_to'] = replyTo;
            if (editId) bodyData['edit_id'] = editId;
            if (images.length) bodyData['images'] = images;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(bodyData),
            });

            if (!response.ok) {
                return rejectWithValue('Failed to send comment');
            }

            return;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)

export const CommentsRemove = createAsyncThunk(
    'comments/remove',
    async ({commentId, signal}: {commentId: number, signal?: AbortSignal}, {rejectWithValue, getState}) => {
        try{
            const url = new URL(`${ApiURL}comment/${commentId}/`);

            const state = getState() as { auth: { user: IAuthUser | null } };
            const token = state.auth.user?.access || '';

            if (!token) {
                return rejectWithValue('No auth token');
            }

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                signal,
            });

            if (!response.ok) {
                return rejectWithValue('Failed to remove comment');
            }

            return;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)

export type TCommentsWsExternalActions = ReturnType<typeof commentsWsConnect> | ReturnType<typeof commentsWsDisconnect>;
