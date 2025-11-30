import { useParams } from 'react-router-dom';
import styles from './styles.module.css';
import { useEffect, useState, type FC } from 'react';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { CommentsFetch, commentsWsConnect, commentsWsDisconnect } from '../../services/comments/actions';
import { WsURL } from '../../core/constants';
import { getComments } from '../../services/comments/slice';

const Comment: FC<{ comment: IComment }> = ({ comment }) => {
    return (
        <>
            <div
                id={`comment-${comment.id}`}
                className={styles.comment}
                style={{ paddingLeft: comment.on_comment ? 40 : undefined }}
            >
                <div className={styles.comment__content} dangerouslySetInnerHTML={{ __html: comment.content }}></div>
            </div>
            {comment.reply?.map((item) => (
                <Comment comment={item} key={`comment_${comment.id}-${item.id}`} />
            ))}
        </>
    );
};

export const CommentsList = () => {
    const [pending, setPending] = useState<boolean>(false);

    const { postId } = useParams();

    const dispatch = useAppDispatch();

    const comments = useAppSelector(getComments);

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
