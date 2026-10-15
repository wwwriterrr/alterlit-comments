import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import { addComments, commentLikesSet, commentRemoved, commentUpserted, setComments, setCommentsAfterExist } from "./slice";
import { setCommentsListDenied } from "../auth/slice";
import { api, ApiError, errorText } from "../http";

export const commentsWsConnect = createAction<string, 'FEED_CONNECT'>('FEED_CONNECT');

export const commentsWsDisconnect = createAction('FEED_DISCONNECT');

export type TCommentsFetchProps = {
    instanceId: string,
    dispatchMethod?: 'set' | 'add',
    type: string,
    signal?: AbortSignal,
    /** более ранние ветки: id первого загруженного верхнего комментария */
    before?: number,
    /** якорь ?comment_id: от ветки этого комментария до самых новых */
    commentId?: number,
}

/** Список: GET v2comments/<type>/<id>/. Отказ (закрыты, недоступна) — в права, вместо списка. */
export const CommentsFetch = createAsyncThunk(
    'comments/fetch',
    async ({ dispatchMethod = 'set', type = 'post', instanceId, signal, before, commentId }: TCommentsFetchProps, { rejectWithValue, dispatch }) => {
        try {
            const q = new URLSearchParams();
            if (before) q.set('before', `${before}`);
            if (commentId) q.set('comment_id', `${commentId}`);
            const query = q.toString();

            const data = await api<{ comments: IComment[], after_exist: boolean }>(
                `v2comments/${type}/${instanceId}/${query ? `?${query}` : ''}`,
                { signal },
            );

            if (dispatchMethod === 'set') dispatch(setComments(data.comments));
            else if (dispatchMethod === 'add') dispatch(addComments(data.comments));
            dispatch(setCommentsAfterExist(data.after_exist));

            return;
        } catch (error) {
            if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
                dispatch(setCommentsListDenied(error.status === 404 ? 'Публикация не найдена.' : error.detail));
            }
            return rejectWithValue(errorText(error));
        }
    }
);

/** Новый комментарий / ответ (POST) или правка (PATCH). Ответ сервера сразу встаёт в список — не ждём сокет. */
export const CommentsSend = createAsyncThunk(
    'comments/send',
    async ({ instanceId, type = 'post', content, replyTo, editId, images = [] }: {
        instanceId: string;
        type: string;
        content: string;
        replyTo?: number;
        editId?: number;
        images?: number[];
    }, { rejectWithValue, dispatch }) => {
        try {
            const body: { content: string, reply_to?: number, images: number[] } = { content, images };
            if (replyTo && !editId) body.reply_to = replyTo;

            const data = editId
                ? await api<{ comment: IComment }>(`v2comments/comment/${editId}/`, { method: 'PATCH', body })
                : await api<{ comment: IComment }>(`v2comments/${type}/${instanceId}/`, { method: 'POST', body });

            dispatch(commentUpserted(data.comment));
            return;
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    }
)

export const CommentsRemove = createAsyncThunk(
    'comments/remove',
    async ({ commentId, onComment, signal }: { commentId: number, onComment?: number, signal?: AbortSignal }, { rejectWithValue, dispatch }) => {
        try {
            await api(`v2comments/comment/${commentId}/`, { method: 'DELETE', signal });
            dispatch(commentRemoved({ comment_id: commentId, on_comment: onComment }));
            return;
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    }
)

/** Массовое удаление (модератор). */
export const CommentsGroupRemove = createAsyncThunk(
    'comments/groupRemove',
    async ({ commentIds, type = 'post', instanceId, signal }: { commentIds: number[], type?: string, instanceId: string | number, signal?: AbortSignal }, { rejectWithValue }) => {
        try {
            await api(`v2comments/${type}/${instanceId}/bulk-delete/`, { method: 'POST', body: { comment_ids: commentIds }, signal });
            return;
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    }
)

/** Лайк: liked — уже стоит → снять (DELETE), иначе поставить (PUT). Повтор безопасен. */
export const CommentsLike = createAsyncThunk(
    'comments/Like',
    async ({ objectId, liked, signal }: { objectId: number, liked: boolean, signal?: AbortSignal }, { rejectWithValue, dispatch }) => {
        try {
            const data = await api<{ liked: boolean, likes: number[] }>(`v2comments/comment/${objectId}/like/`, {
                method: liked ? 'DELETE' : 'PUT',
                signal,
            });
            dispatch(commentLikesSet({ id: objectId, likes: data.likes }));
            return;
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    }
)

export const CommentsUserAutocomplete = createAsyncThunk(
    'commens/autocomplete/users',
    async ({ q, signal }: { q: string, signal?: AbortSignal }, { rejectWithValue }) => {
        try {
            return await api<{ objects: TAutocompleteUser[], more: boolean }>(
                `v2comments/users/?${new URLSearchParams({ q })}`,
                { signal },
            );
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    }
)

/** Мои картинки для вложений, новые сверху. */
export const CommentsFetchImages = createAsyncThunk(
    'comments/fetchImages',
    async ({ limit = 21, lastId, signal }: { limit?: number, lastId?: number, signal?: AbortSignal }, { rejectWithValue }) => {
        try {
            const q = new URLSearchParams({ limit: `${limit}` });
            if (lastId) q.set('last_id', `${lastId}`);
            return await api<{ images: IAppImage[], more: boolean }>(`v2comments/images/?${q}`, { signal });
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    }
)

/** Жалоба на комментарий — задачей в поддержку (аноним указывает email). */
export const CommentComplaint = createAsyncThunk(
    'comment/complaint',
    async ({ data, signal }: { data: FormData, signal?: AbortSignal }, { rejectWithValue }) => {
        try {
            await api('support/task/session/', { method: 'POST', body: data, signal });
            return;
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    }
)

export const CommentUpload = createAsyncThunk(
    'comment/upload',
    async ({ files, signal }: { files: File[], signal?: AbortSignal }, { rejectWithValue }) => {
        try {
            const data = new FormData();
            files.forEach((file) => data.append(`attach-${crypto.randomUUID()}`, file));

            const response = await api<{ files: [string, IAppImage][], errors: [string, string][] }>(
                'v2comments/images/',
                { method: 'POST', body: data, signal },
            );

            if (!response.files.length) return rejectWithValue('Ошибка загрузки');
            return response.files;
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    }
)

export type TCommentsWsExternalActions = ReturnType<typeof commentsWsConnect> | ReturnType<typeof commentsWsDisconnect>;
