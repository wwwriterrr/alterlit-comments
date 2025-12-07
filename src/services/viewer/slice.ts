import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface IInitialState {
    currentImage: IViewerImage | null,
    isOpen: boolean,
    layoutId?: string;
}

const initialState: IInitialState = {
    currentImage: null,
    isOpen: false,
    layoutId: undefined,
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
            state.layoutId = action.payload.layoutId;
        },
        closeViewer: (state) => {
            state.isOpen = false;
            state.currentImage = null;
            state.layoutId = undefined;
        },
    },
    selectors: {
        getViewerCurrentImage: state => state.currentImage,
        getViewerOpen: state => state.isOpen,
        getViewerLayoutId: state => state.layoutId,
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
    getViewerLayoutId,
} = ViewerSlice.selectors;

export default ViewerSlice;

export type TViewerInternalActions = ReturnType<typeof ViewerSlice.actions[keyof typeof ViewerSlice.actions]>;
