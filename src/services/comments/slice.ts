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
}

const initialState: IInitialState = {
    comments: [],
    status: WebsocketStatus.OFFLINE,
    connectionError: '',
    socket: null,
    afterExist: false,
};

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
            if (action.payload.message.type === 'new_comment') {
                const comment = action.payload.message.comment;
                if (comment.on_comment) {
                    const parent = state.comments.find((item) => item.id === comment.on_comment);
                    if (parent) {
                        state.comments = state.comments.map((item) => {
                            if (item.id === parent.id) {
                                item.reply = [...(item.reply || []), comment];
                            }

                            return item;
                        });
                    }
                } else {
                    state.comments = [...state.comments, comment];
                }
            } else if (action.payload.message.type === 'change_comment') {
                const updatedComment = action.payload.message.comment;

                if (updatedComment.on_comment) {
                    // Обновляем ответ на комментарий
                    const parent = state.comments.find((item) => item.id === updatedComment.on_comment);
                    if (parent) {
                        state.comments = state.comments.map((item) => {
                            if (item.id === parent.id) {
                                return {
                                    ...item,
                                    reply: (item.reply || []).map((replyItem) =>
                                        replyItem.id === updatedComment.id ? updatedComment : replyItem
                                    ),
                                };
                            }
                            return item;
                        });
                    }
                } else {
                    // Обновляем комментарий верхнего уровня
                    state.comments = state.comments.map((item) =>
                        item.id === updatedComment.id ? {...updatedComment, reply: item.reply} : item
                    );
                }
            } else if (action.payload.message.type === 'remove_comment') {
                const { comment_id, on_comment } = action.payload.message;

                if (on_comment) {
                    // Удаляем ответ на коммента��ий
                    const parent = state.comments.find((item) => item.id === on_comment);
                    if (parent) {
                        state.comments = state.comments.map((item) => {
                            if (item.id === parent.id) {
                                return {
                                    ...item,
                                    reply: (item.reply || []).filter((replyItem) => replyItem.id !== comment_id),
                                };
                            }
                            return item;
                        });
                    }
                } else {
                    // Удаляем комментарий верхнего уровня и все его ответы (каскадное удаление)
                    state.comments = state.comments
                        .filter((item) => item.id !== comment_id) // Удаляем сам комментарий
                        .map((item) => ({
                            ...item,
                            reply: (item.reply || []).filter(
                                (replyItem) => replyItem.on_comment !== comment_id // Удаляем все ответы на удаляемый комментарий
                            ),
                        }));
                }
            } else if (action.payload.message.type === 'like_comment') {
                const { comment_id, user_id } = action.payload.message;

                const addLikeRec = (items: IComment[] | undefined): boolean => {
                    if (!items) return false;
                    for (const item of items) {
                        if (item.id === comment_id) {
                            item.likes = item.likes || [];
                            if (!item.likes.includes(user_id)) {
                                item.likes.push(user_id);
                            }
                            return true;
                        }
                        if (addLikeRec(item.reply)) return true;
                    }
                    return false;
                };

                addLikeRec(state.comments);
            } else if (action.payload.message.type === 'dislike_comment') {
                const { comment_id, user_id } = action.payload.message;

                const removeLikeRec = (items: IComment[] | undefined): boolean => {
                    if (!items) return false;
                    for (const item of items) {
                        if (item.id === comment_id) {
                            if (item.likes && item.likes.length) {
                                item.likes = item.likes.filter((id) => id !== user_id);
                            }
                            return true;
                        }
                        if (removeLikeRec(item.reply)) return true;
                    }
                    return false;
                };

                removeLikeRec(state.comments);
            }
        },
        // wsSend: (state, action: PayloadAction<unknown>) => {
        //     state.socket?.send(JSON.stringify(action.payload));
        // },
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
    },
});

export const { setComments, addComments, setCommentsAfterExist, wsClose, wsConnecting, wsError, wsMessage, wsOpen } = CommentsSlice.actions;

export const { getComments, getComment, getCommentsAfterExist } = CommentsSlice.selectors;

export default CommentsSlice;

export type TCommentsInternalActions = ReturnType<(typeof CommentsSlice.actions)[keyof typeof CommentsSlice.actions]>;
