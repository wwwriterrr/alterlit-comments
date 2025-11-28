import { useParams } from 'react-router-dom';
import styles from './styles.module.css';

export const Comments = () => {
    const {postId} = useParams();

    return (
        <div className={styles.wrap}>
            {postId}
        </div>
    );
}
