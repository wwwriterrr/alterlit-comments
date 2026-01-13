import { useCallback } from 'react';
import { getSelectedComments, setSelectedComments } from '../../services/comments/slice';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { CloseIcon } from '../icons/close';
import { TrashIcon } from '../icons/trash';
import styles from './styles.module.css';
import { CommentsGroupRemove } from '../../services/comments/actions';
import { useParams } from 'react-router-dom';

export const CommentsAdminManage = () => {
    const dispatch = useAppDispatch();

    const {postId} = useParams();

    const selected = useAppSelector(getSelectedComments);

    const handleReset = useCallback(() => {
        dispatch(setSelectedComments([]));
    }, [dispatch])

    const handleRemove = useCallback(() => {
        const msg = `Вы точно хотите удалить выбранные комментарии? (${selected.length} шт.)`;
        const res = confirm(msg)

        if (res) {
            dispatch(CommentsGroupRemove({commentIds: selected, instanceId: postId!}))
                .unwrap()
                .then(() => {
                    dispatch(setSelectedComments([]));
                })
        }
    }, [dispatch, selected, postId]);

    return (
        <>{selected.length ? (
            <div className={styles.manage}>
                <div className={styles.manage__title}>Выберите действие (админ):</div>
                <div className={styles.manage__buttons}>
                    <button
                        className={styles.manage__delete}
                        onClick={handleRemove}
                        title="Удалить выделенные комментарии"
                    >
                        <TrashIcon size={24} fill="#D78778" />
                    </button>
                    <button
                        className={styles.manage__reset}
                        onClick={handleReset}
                        title="Снять выделение"
                    >
                        <CloseIcon size={16} fill="#444" />
                    </button>
                </div>
            </div>
        ) : null}</>
    )
}
