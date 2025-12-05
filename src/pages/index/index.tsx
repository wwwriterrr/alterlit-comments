import styles from './styles.module.css';
import { CommentsList } from '../../components/commentsList';
import { CommentForm } from '../../components/forms/newComment';
import { useAppSelector } from '../../services/store';
import { getCommentsPerms, getCommentsPermsChecked, getUser } from '../../services/auth/slice';
import { LoaderSpinnerIcon } from '../../components/icons/loader';
import { type FC } from 'react';
import { WarningIcon } from '../../components/icons/warning';

const PermsError: FC<{ msg: string }> = ({ msg }) => {
    console.log(decodeURI(`${msg}`));
    return (
        <div className={styles.permsError}>
            <div className={styles.permsError__wrap}>
                <WarningIcon size={32} fill="#e86969" />
                <div className={styles.permsError__text}>{decodeURI(msg)}</div>
            </div>
        </div>
    )
}

export const Comments = () => {
    const perms = useAppSelector(getCommentsPerms);
    const permsChecked = useAppSelector(getCommentsPermsChecked);
    const user = useAppSelector(getUser);

    console.log(perms);

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
                                <PermsError msg={perms.comments_send_detail} />
                            )}
                        </>
                    ) : (
                        <PermsError msg={perms.comments_list_detail} />
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
