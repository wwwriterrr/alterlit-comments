import { useParams } from 'react-router-dom';
import styles from './styles.module.css';
import { useEffect, useState, type FC } from 'react';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { CommentsFetch, commentsWsConnect, commentsWsDisconnect } from '../../services/comments/actions';
import { WsURL } from '../../core/constants';
import { getComments } from '../../services/comments/slice';
import { Comment } from './item';

export const CommentsList: FC = () => {
    const [pending, setPending] = useState<boolean>(false);

    const { postId } = useParams();

    const dispatch = useAppDispatch();

    const comments = useAppSelector(getComments);
    const commentsAfterExist = useAppSelector((state) => state.comments.afterExist);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchComments = async () => {
            if (!isMounted) return;

            setPending(true);

            try {
                await dispatch(
                    CommentsFetch({
                        instanceId: postId as string,
                        type: 'post',
                        signal,
                    })
                ).unwrap();

                if (isMounted && postId) {
                    dispatch(commentsWsConnect(`${WsURL}comments/post/${postId}/`));
                }

                setPending(false);
            } catch (error) {
                console.error(error);
                if (isMounted) {
                    setPending(false);
                }
            }
        };

        if (postId) {
            fetchComments();
        }

        return () => {
            isMounted = false;
            if (!signal.aborted) controller.abort();
            dispatch(commentsWsDisconnect());
        };
    }, [postId, dispatch]);

    if (!postId) return null;

    return (
        <div className={styles.wrap}>
            {pending ? (
                <div className={styles.loader}>Loading ...</div>
            ) : (
                <>
                    {comments.length ? (
                        <div className={styles.list}>
                            {commentsAfterExist ? <button>Предыдущие комментарии</button> : null}
                            {comments.map((item) => (
                                <Comment comment={item} key={`comment-${item.id}`} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.empty}>Комментарии отсутствуют</div>
                    )}
                </>
            )}
        </div>
    );
};
