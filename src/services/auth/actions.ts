import { createAsyncThunk } from '@reduxjs/toolkit';
import { api, ApiError, errorText } from '../http';

/** /api/v1/users/session/self/ — та же ручка, что у чата и блока пользователя. */
type TSessionSelf = {
    id: number;
    username: string;
    name: string;
    avatar: string | null;
    is_staff: boolean;
};

/** /api/v1/v2comments/<type>/<id>/perms/ */
type TCommentsPermsResponse = {
    can_send: boolean;
    send_reason: string | null;
    is_moderator: boolean;
    edit_window: number;
    max_images: number;
};

/** Кто смотрит страницу: пользователь сессии или null (аноним). */
export const AuthCheckUser = createAsyncThunk<IAuthUser | null, void, { rejectValue: string }>(
    'auth/checkUser',
    async (_, { rejectWithValue }) => {
        try {
            const me = await api<TSessionSelf>('users/session/self/');
            return {
                id: me.id,
                username: me.username,
                name: me.name,
                avatar: me.avatar,
                // модератор комментариев — is_staff (то же правило на бэке, api/comments_v2/rights.py)
                perms: me.is_staff ? ['admin'] : [],
            };
        } catch (err) {
            if (err instanceof ApiError && (err.status === 401 || err.status === 403)) return null;
            return rejectWithValue(errorText(err));
        }
    },
);

/** Право писать комментарии к записи (только вошедшим). Читать или нет — решает сам список. */
export const CommentsFetchPerms = createAsyncThunk<TCommentsPermsResponse, { type: string; instanceId: string }, { rejectValue: string }>(
    'auth/commentsPerms',
    async ({ type, instanceId }, { rejectWithValue }) => {
        try {
            return await api<TCommentsPermsResponse>(`v2comments/${type}/${instanceId}/perms/`);
        } catch (err) {
            return rejectWithValue(errorText(err));
        }
    },
);
