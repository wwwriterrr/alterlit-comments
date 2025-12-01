import styles from './styles.module.css';
import { CommentsList } from '../../components/commentsList';
import { CommentForm } from '../../components/forms/newComment';
import { useAppSelector } from '../../services/store';
import { getUser } from '../../services/auth/slice';

export const Comments = () => {
    const user = useAppSelector(getUser);

    return (
        <div className={styles.wrap}>
            <CommentsList />
            {user ? (
                <CommentForm />
            ) : null}
        </div>
    );
}
