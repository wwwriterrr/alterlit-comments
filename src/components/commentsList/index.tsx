import { Link, useParams } from 'react-router-dom';
import styles from './styles.module.css';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { CommentsFetch, commentsWsConnect, commentsWsDisconnect } from '../../services/comments/actions';
import { HostURL, WsURL } from '../../core/constants';
import { getComments } from '../../services/comments/slice';
import { LikeIcon } from '../icons/like';
import { ReplyIcon } from '../icons/reply';
import { ComplaintIcon } from '../icons/complaint';
import { EditIcon } from '../icons/edit';
import { TrashIcon } from '../icons/trash';
import { CommentForm } from '../forms/newComment';
import { CloseIcon } from '../icons/close';

const Comment: FC<{ comment: IComment }> = ({ comment }) => {
    const [showReply, setShowReply] = useState<boolean>(false);
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
    const [showEditForm, setShowEditForm] = useState<boolean>(false);

    const handleShowReply = useCallback(() => {
        setShowReply(!showReply);
    }, [showReply])

    const liked = useMemo(() => comment.likes?.includes(1), [comment.likes]);

    const dt = useMemo(() => new Date(comment.dt).toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }), [comment.dt]);

    const handleReply = useCallback(() => {
        setShowEditForm(false);
        setShowReplyForm(!showReplyForm);
    }, [showReplyForm]);

    const handleEdit = useCallback(() => {
        setShowReplyForm(false);
        setShowEditForm(!showEditForm);
    }, [showEditForm]);

    return (
        <>
            <div
                id={`comment-${comment.id}`}
                className={`${styles.comment} ${comment.on_comment ? styles.comment_reply : ''}`}
            >
                <div className={styles.comment__avatar}>
                    <img className={styles.comment__avatar__image} src={`${HostURL}${comment.author.avatar}`} alt={comment.author.name} />
                </div>
                <div className={styles.comment__body}>
                    <div className={styles.comment__head}>
                        <div className={styles.comment__user}>
                            <Link className={styles.comment__user__link} to={`/profile/${comment.author.username}/`}>{comment.author.name}</Link>
                        </div>
                        <div className={styles.comment__dt}>{dt}</div>
                    </div>
                    {comment.images?.length ? (
                        <div className={styles.comment__attach} style={{ opacity: showEditForm ? 0.5 : 1 }}>
                            {comment.images.map((image) => (
                                <img
                                    key={`comment-image-${image.id}`}
                                    className={styles.comment__attach__item}
                                    src={`${HostURL}${image.url}`}
                                    alt={`Comment image ${image.id}`}
                                />
                            ))}
                        </div>
                    ) : null}
                    <div
                        className={styles.comment__content}
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                        style={{ opacity: showEditForm ? 0.5 : 1 }}
                    ></div>
                    <div className={styles.comment__manage}>
                        <button
                            className={styles.comment__likes}
                            style={{ opacity: showEditForm ? 0.5 : 1 }}
                            disabled={showEditForm}
                        >
                            <LikeIcon size={26} fill={liked ? '#D78778' : '#DFD9C2'} />
                            {comment.likes?.length ? (
                                <span>{comment.likes.length}</span>
                            ) : null}
                        </button>
                        <button
                            className={styles.comment__reply}
                            title='Ответить'
                            onClick={handleReply}
                            style={{ opacity: showEditForm ? 0.5 : 1 }}
                        >
                            {showReplyForm ? (
                                <CloseIcon size={20} fill="#bbb7a7" />
                            ) : (
                                <ReplyIcon size={20} fill="#bbb7a7" />
                            )}
                        </button>
                        <button
                            className={styles.comment__complaint}
                            title='Пожаловаться'
                            style={{ opacity: showEditForm ? 0.5 : 1 }}
                            disabled={showEditForm || showReplyForm}
                        >
                            <ComplaintIcon size={20} fill="#bbb7a7" />
                        </button>
                        <button
                            className={styles.comment__edit}
                            title='Редактировать'
                            onClick={handleEdit}
                        >
                            {showEditForm ? (
                                <CloseIcon size={20} fill="#000" />
                            ) : (
                                <EditIcon size={20} fill="#0079f0" />
                            )}
                        </button>
                        <button
                            className={styles.comment__remove}
                            title='Удалить'
                            style={{ opacity: showEditForm ? 0.5 : 1 }}
                            disabled={showEditForm || showReplyForm}
                        >
                            <TrashIcon size={20} fill="#D78778" />
                        </button>
                    </div>
                    {comment.reply && comment.reply.length ? (
                        <button className={styles.comment__showReply} onClick={handleShowReply}>{showReply ? 'Скрыть' : 'Показать'} ответы {!showReply ? `(${comment.reply.length})` : ''}</button>
                    ) : null}
                </div>
            </div>
            {showReplyForm ? (
                <CommentForm
                    replyTo={comment.on_comment ? comment.on_comment : comment.id}
                />
            ) : null}
            {showEditForm ? (
                <CommentForm
                    editId={comment.id}
                    style={{
                        paddingLeft: comment.on_comment ? 60 : undefined,
                    }}
                />
            ) : null}
            {comment.reply && comment.reply.length && showReply ? (
                <>
                    {comment.reply?.map((item) => (
                        <Comment comment={item} key={`comment_${comment.id}-${item.id}`} />
                    ))}
                </>
            ) : null}
        </>
    );
};

export const CommentsList = () => {
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
                            {commentsAfterExist ? (
                                <button>Предыдущие комментарии</button>
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
