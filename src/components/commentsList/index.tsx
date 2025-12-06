import { useLocation, useParams } from 'react-router-dom';
import styles from './styles.module.css';
import { useCallback, useEffect, useState, type FC } from 'react';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { CommentsFetch, commentsWsConnect, commentsWsDisconnect, type TCommentsFetchProps } from '../../services/comments/actions';
import { WsURL } from '../../core/constants';
import { getComments } from '../../services/comments/slice';
import { Comment } from './item';
import { LoaderSpinnerIcon } from '../icons/loader';

export const CommentsList: FC = () => {
    const [pending, setPending] = useState<boolean>(false);
    const [pendingMore, setPendingMore] = useState<boolean>(false);

    const { postId } = useParams();

    const location = useLocation();

    const dispatch = useAppDispatch();

    const comments = useAppSelector(getComments);
    const commentsAfterExist = useAppSelector((state) => state.comments.afterExist);

    const handleMore = useCallback(() => {
        if (!commentsAfterExist) return;
        if (!postId) return;

        setPendingMore(true);
        dispatch(CommentsFetch({
            instanceId: postId,
            dispatchMethod: 'add',
            type: 'post',
            filters: { date__lt: comments[0].dt },
        }))
            .finally(() => setPendingMore(false))
    }, [dispatch, commentsAfterExist, postId, comments])

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();
        const signal = controller.signal;
        const search = new URLSearchParams(location.search);
        const isCommentAnchor = search.has('anchor') && search.get('anchor') == 'comments' && search.has('comment_id');

        const fetchComments = async () => {
            if (!isMounted) return;

            setPending(true);

            const fetchParams: TCommentsFetchProps = {
                instanceId: postId as string,
                type: 'post',
                signal,
            }

            if(isCommentAnchor){
                fetchParams.limit = 'all';
            }

            try {
                await dispatch(CommentsFetch(fetchParams))
                    .unwrap()
                    .then(() => {
                        if(isCommentAnchor){
                            setTimeout(() => {
                                const commentId = search.get('comment_id');
                                const elem = document.getElementById(`comment-${commentId}`);

                                if(elem){
                                    const rect = elem.getBoundingClientRect();
                                    const top = rect.top;
                                    window.scrollTo(0, top);
                                } else {
                                    console.error('Comment does not exist');
                                }
                            }, 300)
                        }
                    })

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
    }, [postId, dispatch, location.search]);

    if (!postId) return null;

    return (
        <div className={styles.wrap}>
            {pending ? (
                <div className={styles.loader}>Loading ...</div>
            ) : (
                <>
                    {comments.length ? (
                        <div className={styles.list}>
                            {commentsAfterExist ? (
                                <button className={styles.moreBtn} onClick={handleMore}>
                                    {pendingMore ? (
                                        <LoaderSpinnerIcon size={24} fill="#444" />
                                    ) : 'Предыдущие комментарии'}
                                </button>
                            ) : null}
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
