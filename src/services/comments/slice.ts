import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const WebsocketStatus = {
    CONNECTING: 'CONNECTING...',
    ONLINE: 'ONLINE',
    OFFLINE: 'OFFLINE',
} as const;

type WebsocketStatus = (typeof WebsocketStatus)[keyof typeof WebsocketStatus];

interface IInitialState {
    comments: IComment[];
    status: WebsocketStatus;
    connectionError: string | null;
    socket: WebSocket | null;
}

const initialState: IInitialState = {
    comments: [],
    status: WebsocketStatus.OFFLINE,
    connectionError: '',
    socket: null,
};

export const CommentsSlice = createSlice({
    name: 'comments',
    initialState,
    reducers: {
        setComments: (state, action: PayloadAction<IComment[]>) => {
            state.comments = action.payload;
        },
        addComments: (state, action: PayloadAction<IComment[]>) => {
            state.comments = [...state.comments, ...action.payload];
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
                // Change
            }
        },
        // wsSend: (state, action: PayloadAction<unknown>) => {
        //     state.socket?.send(JSON.stringify(action.payload));
        // },
    },
    selectors: {
        getComments: (state) => state.comments,
    },
});

export const { setComments, addComments, wsClose, wsConnecting, wsError, wsMessage, wsOpen } = CommentsSlice.actions;

export const { getComments } = CommentsSlice.selectors;

export default CommentsSlice;

export type TCommentsInternalActions = ReturnType<(typeof CommentsSlice.actions)[keyof typeof CommentsSlice.actions]>;
