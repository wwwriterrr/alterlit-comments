import { createSlice } from '@reduxjs/toolkit';
import { 
    type ReactElement 
} from 'react';
import type { PayloadAction} from '@reduxjs/toolkit';

type TTitleContent = null | string | ReactElement

type TInitialState = {
    title: TTitleContent,
    content: TTitleContent,
    visible: boolean,
    className: string | null,
}

const initialState: TInitialState = {
    title: null,
    content: null,
    visible: false,
    className: null,
}

export const ModalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        setModalTitle: (state, action: PayloadAction<TTitleContent>) => {
            state.title = action.payload;
        },
        setModalContent: (state, action: PayloadAction<TTitleContent>) => {
            state.content = action.payload;
        },
        setModalClass: (state, action: PayloadAction<string | null>) => {
            state.className = action.payload;
        },
        setModalVisible: (state, action: PayloadAction<boolean>) => {
            state.visible = action.payload;
        },
        openModal: (state, action: PayloadAction<{content: string | ReactElement, title?: string | ReactElement, className?: string}>) => {
            state.content = action.payload.content;
            if(action.payload.title){
                state.title = action.payload.title;
            }
            if(action.payload.className){
                state.className = action.payload.className;
            }
            state.visible = true;
        },
        closeModal: (state) => {
            state.visible = false;
            state.content = null;
            state.title = null;
            state.className = null;
        },
        animateCloseModal: (
            state, 
            action: PayloadAction<number>
        ) => {
            console.log('duration', action.payload);
            state.visible = false;
            // setTimeout(() => {
            //     state.content = null;
            //     state.title = null;
            //     state.className = null;
            // }, action.payload)
        },
    },
    selectors: {
        getModalTitle: state => state.title,
        getModalContent: state => state.content,
        getModalClass: state => state.className,
        getModalVisible: state => state.visible,
    }
})

export const {
    setModalClass,
    setModalContent,
    setModalTitle,
    setModalVisible,
    openModal,
    closeModal,
    animateCloseModal,
} = ModalSlice.actions;

export const { 
    getModalClass,
    getModalContent,
    getModalTitle,
    getModalVisible,
} = ModalSlice.selectors;

export type TModalInternalActions = ReturnType<typeof ModalSlice.actions[keyof typeof ModalSlice.actions]>;

