import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

const WebsocketStatus = {
    CONNECTING: 'CONNECTING...',
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
} as const;

type WebsocketStatus = (typeof WebsocketStatus)[keyof typeof WebsocketStatus];

export interface IInitialState {
    comments: IComment[];
    status: WebsocketStatus;
    connectionError: string | null;
    socket: WebSocket | null;
    afterExist: boolean;
    selected: number[],
}

const initialState: IInitialState = {
    comments: [],
    status: WebsocketStatus.OFFLINE,
    connectionError: '',
    socket: null,
    afterExist: false,
    selected: [],
};

/** Комментарий или ответ по id. */
function findComment(items: IComment[], id: number): IComment | undefined {
    for (const item of items) {
        if (item.id === id) return item;
        const reply = item.reply?.find((r) => r.id === id);
        if (reply) return reply;
    }
    return undefined;
}

/**
 * Вставить или обновить: один и тот же комментарий приходит и в ответе API, и по сокету
 * (new_comment, затем change_comment с картинками) — дублей быть не должно.
 * Ответы и лайки, которых нет в событии, сохраняем.
 */
function upsertComment(items: IComment[], comment: IComment) {
    const existing = findComment(items, comment.id);
    if (existing) {
        const { reply, likes } = existing;
        Object.assign(existing, comment, {
            reply: comment.reply ?? reply,
            likes: comment.likes ?? likes,
        });
        return;
    }
    if (comment.on_comment) {
        const parent = items.find((item) => item.id === comment.on_comment);
        if (parent) parent.reply = [...(parent.reply || []), comment];
        return;
    }
    items.push({ ...comment, reply: comment.reply ?? [] });
}

function removeComment(state: { comments: IComment[] }, id: number, onComment?: number) {
    if (onComment) {
        const parent = state.comments.find((item) => item.id === onComment);
        if (parent) parent.reply = (parent.reply || []).filter((r) => r.id !== id);
        return;
    }
    // верхний — вместе с веткой ответов
    state.comments = state.comments.filter((item) => item.id !== id);
}

export const CommentsSlice = createSlice({
    name: 'comments',
    initialState,
    reducers: {
        setComments: (state, action: PayloadAction<IComment[]>) => {
            state.comments = action.payload;
        },
        addComments: (state, action: PayloadAction<IComment[]>) => {
            state.comments = [...action.payload, ...state.comments,];
        },
        setCommentsAfterExist: (state, action: PayloadAction<boolean>) => {
            state.afterExist = action.payload;
        },
        wsConnecting: (state) => {
            state.status = WebsocketStatus.CONNECTING;
        },
        wsOpen: (state) => {
            state.status = WebsocketStatus.ONLINE;
            state.connectionError = null;
            // state.socket = action.payload;
        },
        wsClose: (state) => {
            state.status = WebsocketStatus.OFFLINE;
            state.socket = null;
        },
        wsError: (state, action) => {
            state.connectionError = action.payload;
        },
        wsMessage: (state, action: PayloadAction<IWsMessage>) => {
            const message = action.payload.message;
            if (message.type === 'new_comment' || message.type === 'change_comment') {
                upsertComment(state.comments, message.comment);
            } else if (message.type === 'remove_comment') {
                removeComment(state, message.comment_id, message.on_comment);
            } else if (message.type === 'like_comment' || message.type === 'dislike_comment') {
                const item = findComment(state.comments, message.comment_id);
                if (!item) return;
                const likes = (item.likes || []).filter((id) => id !== message.user_id);
                item.likes = message.type === 'like_comment' ? [...likes, message.user_id] : likes;
            }
        },
        /** Свой новый/изменённый комментарий из ответа API — не ждём сокет (он потом совпадёт по id). */
        commentUpserted: (state, action: PayloadAction<IComment>) => {
            upsertComment(state.comments, action.payload);
        },
        commentRemoved: (state, action: PayloadAction<{ comment_id: number, on_comment?: number }>) => {
            removeComment(state, action.payload.comment_id, action.payload.on_comment);
        },
        commentLikesSet: (state, action: PayloadAction<{ id: number, likes: number[] }>) => {
            const item = findComment(state.comments, action.payload.id);
            if (item) item.likes = action.payload.likes;
        },
        // wsSend: (state, action: PayloadAction<unknown>) => {
        //     state.socket?.send(JSON.stringify(action.payload));
        // },
        setSelectedComments: (state, action: PayloadAction<number[]>) => {
            state.selected = action.payload;
        },
        addSelectedComment: (state, action: PayloadAction<number>) => {
            if (!state.selected.includes(action.payload)) {
                state.selected.push(action.payload);
            }
        },
        removeSelectedComment: (state, action: PayloadAction<number>) => {
            state.selected = state.selected.filter((id) => id !== action.payload);
        },
        toggleSelectedComment: (state, action: PayloadAction<number>) => {
            if (state.selected.includes(action.payload)) {
                state.selected = state.selected.filter((id) => id !== action.payload);
            } else {
                state.selected.push(action.payload);
            }
        },
    },
    selectors: {
        getComments: (state) => state.comments,
        getComment: createSelector(
            (state: IInitialState) => state.comments,
            (_: IInitialState, id: IComment['id']) => id,
            (comments, id) => {
                const findRec = (items: IComment[] | undefined): IComment | undefined => {
                    if (!items) return undefined;
                    for (const item of items) {
                        if (item.id === id) return item;
                        const foundInReply = findRec(item.reply);
                        if (foundInReply) return foundInReply;
                    }
                    return undefined;
                };
                return findRec(comments);
            }
        ),
        getCommentsAfterExist: (state) => state.afterExist,
        getSelectedComments: (state) => state.selected,
    },
});

export const {
    setComments,
    addComments,
    setCommentsAfterExist,
    wsClose,
    wsConnecting,
    wsError,
    wsMessage,
    wsOpen,
    commentUpserted,
    commentRemoved,
    commentLikesSet,
    setSelectedComments,
    addSelectedComment,
    removeSelectedComment,
    toggleSelectedComment,
} = CommentsSlice.actions;

export const {
    getComments,
    getComment,
    getCommentsAfterExist,
    getSelectedComments,
} = CommentsSlice.selectors;

export default CommentsSlice;

export type TCommentsInternalActions = ReturnType<(typeof CommentsSlice.actions)[keyof typeof CommentsSlice.actions]>;
