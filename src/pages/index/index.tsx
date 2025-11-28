import styles from './styles.module.css';
import { CommentsList } from '../../components/commentsList';
import { CommentForm } from '../../components/forms/newComment';

export const Comments = () => {
    return (
        <div className={styles.wrap}>
            <CommentsList />
            <CommentForm />
        </div>
    );
}
