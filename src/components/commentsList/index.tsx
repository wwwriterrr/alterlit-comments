import { useParams } from 'react-router-dom';
import styles from './styles.module.css';
import { useEffect } from 'react';
import { useAppDispatch } from '../../services/store';
import { CommentsFetch } from '../../services/comments/actions';

export const CommentsList = () => {
    const { postId } = useParams();

    const dispatch = useAppDispatch();

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        dispatch(CommentsFetch({instanceId: postId as string, type: 'post', signal}));

        return () => {
            if(!signal.aborted) controller.abort();
        }
    }, [postId])

    if(!postId) return null;

    return (
        <div className={styles.wrap}>
            
        </div>
    );
}
