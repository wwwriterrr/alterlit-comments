import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { getCommentsPerms, getUser } from '../../services/auth/slice';
import styles from './styles.module.css';
import { HostURL } from '../../core/constants';
import { Link, useLocation } from 'react-router-dom';
import { LikeIcon } from '../icons/like';
import { CloseIcon } from '../icons/close';
import { ReplyIcon } from '../icons/reply';
import { ComplaintIcon } from '../icons/complaint';
import { EditIcon } from '../icons/edit';
import { TrashIcon } from '../icons/trash';
import { CommentForm } from '../forms/newComment';
import { CommentsLike, CommentsRemove } from '../../services/comments/actions';
import { openModal } from '../../services/modal/slice';
import { SupportModal } from '../modals/support';

const DELTA = 5 * 60 * 1000;

export const Comment: FC<{ comment: IComment }> = ({ comment }) => {
    const location = useLocation();
    const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const anchorCommentId = useMemo(() => {
        if(search.get('anchor') === 'comments' && search.has('comment_id')) return parseInt(search.get('comment_id') as string);
        return null;
    }, [search])
    const anchorInReply = useMemo(() => {
        if(anchorCommentId){
            if(comment.reply?.find(item => item.id === anchorCommentId)) return true;
        }
        return false;
    }, [comment.reply, anchorCommentId])

    const [showReply, setShowReply] = useState<boolean>(anchorInReply);
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
    const [showEditForm, setShowEditForm] = useState<boolean>(false);
    const [removePending, setRemovePending] = useState<boolean>(false);

    const [currentTime, setCurrentTime] = useState(new Date());

    const dispatch = useAppDispatch();

    const user = useAppSelector(getUser);
    const perms = useAppSelector(getCommentsPerms);

    const isAdmin = useMemo(() => user?.perms.includes('admin'), [user]);

    const isShowReply = useMemo(() => (user && perms.comments_send ? true : false), [user, perms]);

    const isShowTimer = useMemo(() => {
        if(isAdmin) return false;

        if(comment.author.id !== user?.id) return false;

        const diff = currentTime.getTime() - new Date(`${comment.dt}+03:00`).getTime();
        return diff <= (DELTA - 1500);
    }, [isAdmin, comment.author.id, user, currentTime, comment.dt]);

    const isShowEditBtns = useMemo(() => {
        if (isAdmin) return true;

        else {
            if (comment.author.id === user?.id) {
                return isShowTimer;
            } else return false;
        }
    }, [user?.id, isAdmin, comment.author.id, isShowTimer]);

    const timerString = useMemo(() => {
        if (isAdmin) return null;

        const diff = DELTA - (currentTime.getTime() - new Date(`${comment.dt}+03:00`).getTime());

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
        const ss = seconds < 10 ? `0${seconds}` : `${seconds}`;

        return `${mm}:${ss}`;
    }, [currentTime, comment.dt, isAdmin]);

    const handleShowReply = useCallback(() => {
        setShowReply(!showReply);
    }, [showReply]);

    const liked = useMemo(() => comment.likes?.includes(1), [comment.likes]);

    const editedOpacity = useMemo(() => (showEditForm ? 0.3 : undefined), [showEditForm]);

    const dt = useMemo(
        () => {
            return new Date(`${comment.dt}+03:00`).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        },
        [comment.dt]
    );

    const dtModified = useMemo(
        () => {
            if(!comment.dt_modified) return null;

            return new Date(`${comment.dt_modified}+03:00`).toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        },
        [comment]
    );

    const handleReply = useCallback(() => {
        setShowEditForm(false);
        setShowReplyForm(!showReplyForm);
    }, [showReplyForm]);

    const handleEdit = useCallback(() => {
        setShowReplyForm(false);
        setShowEditForm(!showEditForm);
    }, [showEditForm]);

    const handleRemove = useCallback(async () => {
        // dispatch(CommentsRemove({commentId: comment.id}));
        const msg = `Вы точно хотите удалить комментарий${comment.reply?.length ? ' и всю ветку ответов' : ''}?`;
        const res = confirm(msg)

        if(res){
            setRemovePending(true);
            dispatch(CommentsRemove({commentId: comment.id}))
                .finally(() => setRemovePending(false));
        }
    }, [comment.id, comment.reply, dispatch])

    const handleLike = useCallback(() => {
        dispatch(CommentsLike({contentType: 'comment', objectId: comment.id}));
    }, [comment.id, dispatch])

    const handleCompliant = useCallback(() => {
        dispatch(openModal({content: (<SupportModal commentId={comment.id} />)}));
    }, [dispatch, comment.id])

    useEffect(() => {
        if (isAdmin) return;

        const interval = setInterval(() => {
            const diff = new Date().getTime() - new Date(`${comment.dt}+03:00`).getTime();

            if (diff <= (DELTA)) {
                setCurrentTime(new Date());
            } else {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isAdmin, comment.dt]);

    return (
        <>
            <div
                id={`comment-${comment.id}`}
                className={`${styles.comment} ${comment.on_comment ? styles.comment_reply : ''} ${anchorCommentId === comment.id ? styles.comment_highlight : ''}`}
                style={{
                    opacity: removePending ? .3 : undefined,
                }}
            >
                <div className={styles.comment__avatar}>
                    <img
                        className={styles.comment__avatar__image}
                        src={`${HostURL}${comment.author.avatar}`}
                        alt={comment.author.name}
                    />
                </div>
                <div className={styles.comment__body}>
                    <div className={styles.comment__head}>
                        <div className={styles.comment__user}>
                            <Link className={styles.comment__user__link} to={`/profile/${comment.author.username}/`}>
                                {comment.author.name}
                            </Link>
                        </div>
                        <div className={styles.comment__dt}>{dt}</div>
                    </div>
                    {comment.images?.length ? (
                        <div className={styles.comment__attach} style={{ opacity: editedOpacity }}>
                            {comment.images.map((image) => (
                                <img
                                    key={`comment-image-${image.id}`}
                                    className={`${styles.comment__attach__item} to-view`}
                                    src={`${HostURL}${image.url}`}
                                    alt={`Comment image ${image.id}`}
                                    data-fullsrc={`${HostURL}${image.url}`}
                                />
                            ))}
                        </div>
                    ) : null}
                    <div
                        className={styles.comment__content}
                        dangerouslySetInnerHTML={{ __html: comment.content }}
                        style={{ opacity: editedOpacity }}
                    ></div>
                    <div className={styles.comment__manage}>
                        <button
                            className={styles.comment__likes}
                            style={{ opacity: editedOpacity }}
                            disabled={showEditForm}
                            onClick={handleLike}
                        >
                            <LikeIcon size={26} liked={liked} />
                            {comment.likes?.length ? <span>{comment.likes.length}</span> : null}
                        </button>
                        {isShowReply ? (
                            <button
                                className={styles.comment__reply}
                                title="Ответить"
                                onClick={handleReply}
                                style={{ opacity: editedOpacity }}
                            >
                                {showReplyForm ? (
                                    <CloseIcon size={20} fill="#bbb7a7" />
                                ) : (
                                    <ReplyIcon size={20} fill="#bbb7a7" />
                                )}
                            </button>
                        ) : null}
                        <button
                            className={styles.comment__complaint}
                            title="Пожаловаться"
                            style={{ opacity: editedOpacity }}
                            disabled={showEditForm || showReplyForm}
                            onClick={handleCompliant}
                        >
                            <ComplaintIcon size={20} fill="#bbb7a7" />
                        </button>
                        {isShowEditBtns ? (
                            <>
                                <button
                                    className={styles.comment__edit}
                                    title="Редактировать"
                                    onClick={handleEdit}
                                >
                                    {showEditForm ? <CloseIcon size={20} fill="#000" /> : <EditIcon size={20} fill="#0079f0" />}
                                </button>
                                <button
                                    className={styles.comment__remove}
                                    title="Удалить"
                                    style={{ opacity: editedOpacity }}
                                    disabled={showEditForm || showReplyForm}
                                    onClick={handleRemove}
                                >
                                    <TrashIcon size={20} fill="#D78778" />
                                </button>
                            </>
                        ) : null}
                        {!isAdmin && isShowTimer ? (
                            <span className={styles.comment__timer}>
                                {timerString}
                            </span>
                        ) : null}
                    </div>
                    {dtModified ? (
                        <div className={styles.comment__modified}>
                            {`Изм: ${dtModified}`}
                        </div>
                    ) : null}
                    {comment.reply && comment.reply.length ? (
                        <button className={styles.comment__showReply} onClick={handleShowReply}>
                            {showReply ? 'Скрыть' : 'Показать'} ответы {!showReply ? `(${comment.reply.length})` : ''}
                        </button>
                    ) : null}
                </div>
            </div>
            {showReplyForm && isShowReply ? <CommentForm replyTo={comment.on_comment ? comment.on_comment : comment.id} onSuccess={() => {setShowReplyForm(false);setShowReply(true)}} /> : null}
            {showEditForm && isShowEditBtns ? (
                <CommentForm
                    editId={comment.id}
                    style={{
                        paddingLeft: comment.on_comment ? 60 : undefined,
                    }}
                    onSuccess={() => {setShowEditForm(false)}}
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
