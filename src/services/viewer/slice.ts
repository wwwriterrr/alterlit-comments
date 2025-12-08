import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface IInitialState {
    currentImage: IViewerImage | null,
    isOpen: boolean,
}

const initialState: IInitialState = {
    currentImage: null,
    isOpen: false,
};

const ViewerSlice = createSlice({
    name: 'viewer',
    initialState,
    reducers: {
        setViewerCurrentImage: (state, action: PayloadAction<IViewerImage>) => {
            state.currentImage = action.payload;
        },
        setViewerOpen: (state, action: PayloadAction<boolean>) => {
            state.isOpen = action.payload;
        },
        openViewer: (state, action: PayloadAction<{ image: IViewerImage; layoutId?: string }>) => {
            state.isOpen = true;
            state.currentImage = action.payload.image;
        },
        closeViewer: (state) => {
            state.isOpen = false;
            state.currentImage = null;
        },
    },
    selectors: {
        getViewerCurrentImage: state => state.currentImage,
        getViewerOpen: state => state.isOpen,
    },
    
});

export const {
    setViewerCurrentImage,
    setViewerOpen,
    openViewer,
    closeViewer,
} = ViewerSlice.actions;

export const {
    getViewerOpen,
    getViewerCurrentImage,
} = ViewerSlice.selectors;

export default ViewerSlice;

export type TViewerInternalActions = ReturnType<typeof ViewerSlice.actions[keyof typeof ViewerSlice.actions]>;
