import { createAsyncThunk } from "@reduxjs/toolkit";
import { setViewerCurrentImage, setViewerOpen } from "./slice";

export const CloseViewer = createAsyncThunk(
    'viewer/close',
    async ({timeSleep=600}: {timeSleep?: number}, {rejectWithValue, dispatch}) => {
        try {
            dispatch(setViewerOpen(false));

            await new Promise((resolve) => {
                setTimeout(() => {
                    dispatch(setViewerCurrentImage(null));
                    resolve('closed');
                }, timeSleep)
            })
        } catch (err) {
            return rejectWithValue(err);
        }
    }
)
