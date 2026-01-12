import { useCallback } from 'react';
import { getSelectedComments, setSelectedComments } from '../../services/comments/slice';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { CloseIcon } from '../icons/close';
import { TrashIcon } from '../icons/trash';
import styles from './styles.module.css';

export const CommentsAdminManage = () => {
    const dispatch = useAppDispatch();

    const selected = useAppSelector(getSelectedComments);

    const handleReset = useCallback(() => {
        dispatch(setSelectedComments([]));
    }, [dispatch])

    return (
        <>{selected.length ? (
            <div className={styles.manage}>
                <div className={styles.manage__title}>Выберите действие (админ):</div>
                <div className={styles.manage__buttons}>
                    <button className={styles.manage__delete} title="Удалить выделенные комментарии">
                        <TrashIcon size={24} fill="#D78778" />
                    </button>
                    <button className={styles.manage__reset} onClick={handleReset} title="Снять выделение">
                        <CloseIcon size={16} fill="#444" />
                    </button>
                </div>
            </div>
        ) : null}</>
    )
}
