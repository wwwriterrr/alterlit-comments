import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ApiURL } from "../../core/constants";
import { addComments, setComments, setCommentsAfterExist } from "./slice";

export const commentsWsConnect = createAction<string, 'FEED_CONNECT'>('FEED_CONNECT');

export const commentsWsDisconnect = createAction('FEED_DISCONNECT');

export const CommentsFetch = createAsyncThunk(
    'comments/fetch',
    async ({ dispatchMethod='set', type = 'post', instanceId, signal, filters }: { instanceId: string, dispatchMethod?: 'set' | 'add', type: string, signal?: AbortSignal, filters?: {[key: string]: string | number | boolean} }, { rejectWithValue, dispatch }) => {
        try {
            const url = new URL(`${ApiURL}comments/${type}/${instanceId}/`);

            if (filters){
                url.searchParams.set('filters', JSON.stringify(filters));
            }

            const response = await fetch(url, {
                signal,
            });

            if (!response.ok) {
                return rejectWithValue('Failed to fetch comments');
            }

            const data: { comments: IComment[], after_exist: boolean } = await response.json();

            if  (dispatchMethod === 'set')  dispatch(setComments(data.comments));
            else if (dispatchMethod === 'add') dispatch(addComments(data.comments));
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
                    'Accept': 'application/json',
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

export const CommentsLike = createAsyncThunk(
    'comments/Like',
    async ({contentType='comment', objectId, signal}: {contentType?: string, objectId: number, signal?: AbortSignal}, {rejectWithValue, getState}) => {
        try{
            const url = new URL(`${ApiURL}like/${contentType}/${objectId}/`);

            const state = getState() as { auth: { user: IAuthUser | null } };
            const token = state.auth.user?.access || '';

            if (!token) {
                return rejectWithValue('No auth token');
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                signal,
            });

            if (!response.ok) {
                return rejectWithValue('Failed like comment');
            }

            return;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)

export const CommentsUserAutocomplete = createAsyncThunk(
    'commens/autocomplete/users',
    async ({q, signal}: {q: string, signal?: AbortSignal}, {rejectWithValue, getState}) => {
        try{
            const url = new URL(`${ApiURL}autocomplete/users/?q=${q}`);

            const state = getState() as { auth: { user: IAuthUser | null } };
            const token = state.auth.user?.access || '';

            if (!token) {
                return rejectWithValue('No auth token');
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                signal,
            });

            if (!response.ok) {
                return rejectWithValue('Failed like comment');
            }

            const data: {objects: TAutocompleteUser[], more: boolean} = await response.json();

            return data;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)

export const CommentsFetchImages = createAsyncThunk(
    'comments/fetchImages',
    async ({limit=21, signal}: {limit?: number, signal?: AbortSignal}, {rejectWithValue, getState}) => {
        try{
            const url = new URL(`${ApiURL}images/?limit=${limit}`);

            const state = getState() as { auth: { user: IAuthUser | null } };
            const token = state.auth.user?.access || '';

            if (!token) {
                return rejectWithValue('No auth token');
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                signal,
            });

            if (!response.ok) {
                return rejectWithValue('Failed like comment');
            }

            const data: {images: IAppImage[], more: boolean} = await response.json();

            return data;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)

export type TCommentsWsExternalActions = ReturnType<typeof commentsWsConnect> | ReturnType<typeof commentsWsDisconnect>;
