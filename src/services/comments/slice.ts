import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface IInitialState {
    comments: IComment[];
}

const initialState: IInitialState = {
    comments: [],
};

export const CommentsSlice = createSlice({
    name: 'comments',
    initialState,
    reducers: {
        setComments: (state, action: PayloadAction<IComment[]>) => {
            state.comments = action.payload;
        },
    },
    selectors: {
        getComments: state => state.comments,
    }
});

export const {
    setComments,
} = CommentsSlice.actions;

export const {
    getComments,
} = CommentsSlice.selectors;

export default CommentsSlice;

export type TCommentsInternalActions = ReturnType<typeof CommentsSlice.actions[keyof typeof CommentsSlice.actions]>;
