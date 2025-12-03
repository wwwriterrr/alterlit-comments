import { createAsyncThunk } from '@reduxjs/toolkit';
import { closeModal, setModalVisible } from './slice';

export const animateCloseModal = createAsyncThunk(
    'modal/animateCloseModal',
    async (duration: number, { dispatch }) => {
        // Сначала скрываем модальное окно
        dispatch(setModalVisible(false));

        // Затем после задержки очищаем содержимое
        setTimeout(() => {
            dispatch(closeModal());
        }, duration);

        return { duration };
    }
);
