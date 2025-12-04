import { useCallback, useState, type FC, type FormEvent } from 'react';
import styles from './styles.module.css';
import { useAppDispatch, useAppSelector } from '../../../services/store';
import { getUser } from '../../../services/auth/slice';
import { TextField } from '@mui/material';
import { SuccessIcon } from '../../icons/success';
import { animateCloseModal } from '../../../services/modal/actions';
import { LoaderSpinnerIcon } from '../../icons/loader';
import { CommentComplaint } from '../../../services/comments/actions';

export const SupportModal: FC<{commentId: number}> = ({commentId}) => {
    const [pending, setPending] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    const dispatch = useAppDispatch();

    const user = useAppSelector(getUser);

    const handleClose = useCallback(() => {
        dispatch(animateCloseModal(200));
    }, [dispatch])

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const form = e.target as HTMLFormElement;

        const data = new FormData(form);

        setError('');
        setPending(true);
        dispatch(CommentComplaint({data}))
            .unwrap()
            .then(() => {
                setSuccess(true);
            })
            .catch(() => {
                setError('Возникла непредвиденная ошибка. Попробуйте позже.');
            })
            .finally(() => setPending(false))
    }

    return (
        <>
            {success ? (
                <div className={styles.success}>
                    <SuccessIcon size={80} fill="#669551" />
                    <div className={styles.success__text}>
                        <b>Ваша жалоба успешно отправлена.</b>
                        <br />
                        <i>Мы обработаем ее в ближайшее время.</i>
                    </div>
                    <button className={styles.success__btn} onClick={handleClose}>Закрыть</button>
                </div>
            ) : (
                <form className={styles.wrap} onSubmit={handleSubmit}>
                    <input type="hidden" name="content_type" value="comment" />
                    <input type="hidden" name="object_id" value={commentId} />
                    {error ? (
                        <div className={`${styles.row} ${styles.row_error}`}>
                            {error}
                        </div>
                    ) : null}
                    <div className={`${styles.row} ${styles.row_title}`}>
                        Жалоба на комментарий
                    </div>
                    {!user ? (
                        <div className={styles.row}>
                            <TextField
                                variant="filled"
                                name="email"
                                label="Укажите email"
                                required
                                fullWidth
                                type="email"
                                disabled={pending}
                            />
                        </div>
                    ) : null}
                    <div className={styles.row}>
                        <TextField
                            variant="filled"
                            name="text"
                            multiline
                            maxRows={5}
                            label="Опишите, то вас не устраивает"
                            required
                            fullWidth
                            disabled={pending}
                        />
                    </div>
                    <div className={styles.row}>
                        <button 
                            type="submit" 
                            disabled={pending}
                            className={styles.submit}
                        >
                            {pending ? (
                                <LoaderSpinnerIcon size={24} fill="#fff" />
                            ) : 'Отправить'}
                        </button>
                    </div>
                </form>
            )}
        </>
    )
}
