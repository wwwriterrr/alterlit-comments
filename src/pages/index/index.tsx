import styles from './styles.module.css';
import { CommentsList } from '../../components/commentsList';
import { LazyCommentForm as CommentForm } from '../../components/forms/newComment/lazy';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { getAuthChecked, getCommentsPerms, getCommentsPermsChecked, getUser } from '../../services/auth/slice';
import { CommentsFetchPerms } from '../../services/auth/actions';
import { useParams } from 'react-router-dom';
import { LoaderSpinnerIcon } from '../../components/icons/loader';
import { 
    useEffect,
    type FC 
} from 'react';
import { WarningIcon } from '../../components/icons/warning';
import { translateRu } from '../../core/utils';


const PermsError: FC<{ msg: string }> = ({ msg }) => {
    return (
        <div className={styles.permsError}>
            <div className={styles.permsError__wrap}>
                <WarningIcon size={32} fill="#e86969" />
                <div className={styles.permsError__text}>{msg}</div>
            </div>
        </div>
    )
}

export const Comments = () => {
    const perms = useAppSelector(getCommentsPerms);
    const permsChecked = useAppSelector(getCommentsPermsChecked);
    const user = useAppSelector(getUser);
    const authChecked = useAppSelector(getAuthChecked);
    const dispatch = useAppDispatch();
    const { postId } = useParams();
    const userId = user?.id;

    // вошедшему — права на запись к этой публикации; аноним их уже получил («войдите»)
    useEffect(() => {
        if (authChecked && userId && postId) dispatch(CommentsFetchPerms({ type: 'post', instanceId: postId }));
    }, [authChecked, userId, postId, dispatch]);

    return (
        <div className={styles.wrap}>
            {permsChecked ? (
                <>
                    {perms.comments_list ? (
                        <>
                            <CommentsList />
                            {perms.comments_send ? (
                                <>
                                    {user ? (
                                        <CommentForm />
                                    ) : (
                                        <PermsError msg="Чтобы оставлять комментарии, необходимо авторизоваться в системе." />
                                    )}
                                </>
                            ) : (
                                <PermsError msg={translateRu(perms.comments_send_detail)} />
                            )}
                        </>
                    ) : (
                        <PermsError msg={translateRu(perms.comments_list_detail)} />
                    )}
                </>
            ) : (
                <div className={styles.loader}>
                    <LoaderSpinnerIcon size={32} fill="#444" />
                </div>
            )}
        </div>
    );
}
