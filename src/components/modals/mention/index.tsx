import { TextField } from '@mui/material'
import styles from './styles.module.css'
import { useCallback, useEffect, useState, type FC, type RefObject } from 'react'
import { useAppDispatch } from '../../../services/store';
import { CommentsUserAutocomplete } from '../../../services/comments/actions';
import { HostURL } from '../../../core/constants';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { animateCloseModal } from '../../../services/modal/actions';

const MentionItem: FC<{item: TAutocompleteUser, editorRef: RefObject<TinyMCEEditor | null>}> = ({item, editorRef}) => {
    
    const dispatch = useAppDispatch();

    const handleClick = useCallback(() => {
        const editor = editorRef.current;

        if(!editor) return;

        editor.execCommand('mceInsertContent', false, `<a href="/user/${item.id}" data-mention-id="${item.id}">${item.name}</a>&nbsp;`);
        
        dispatch(animateCloseModal(300))
            .then(() => {
                editor.focus();
            })
    }, [editorRef, item, dispatch])
    
    return (
        <div className={styles.item} title={item.name} onClick={handleClick}>
            <img className={styles.item__avatar} src={`${HostURL}${item.avatar}`} alt={item.name}/>
            <div className={styles.item__name}>{item.name}</div>
        </div>
    )
}

export const MentionModal: FC<{editorRef: RefObject<TinyMCEEditor | null>}> = ({editorRef}) => {
    const [pending, setPending] = useState<boolean>(false);
    const [value, setValue] = useState<string>('');
    const [items, setItems] = useState<TAutocompleteUser[]>([]);

    const dispatch = useAppDispatch();

    const fetchUsers = async () => {
        setPending(true);
        dispatch(CommentsUserAutocomplete({ q: value }))
            .unwrap()
            .then((res) => {
                setItems(res.objects);
            })
            .catch((err) => {
                console.log('err', err);
            })
            .finally(() => setPending(false))
    }

    useEffect(() => {
        let timeout: number;

        if (value) {
            timeout = setTimeout(fetchUsers, 300)
        } else {
            // pass
        }

        return () => {
            clearTimeout(timeout);
        }
    }, [value])

    return (
        <div className={styles.wrap}>
            <div className={styles.row}>
                <TextField
                    label="Упомянуть пользователя"
                    variant={'filled'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    fullWidth
                />
            </div>
            <div className={`${styles.items} ${pending ? styles.items_pending : ''}`}>
                {!value ? (
                    <div className={styles.empty}>Начните вводить псевдолним пользователя, чтобы упомянуть его в комментарии</div>
                ) : (
                    <>
                        {items.length ? (
                            <>
                                {items.map((item) => (
                                    <MentionItem key={`mention_user-${item.id}`} item={item} editorRef={editorRef} />
                                ))}
                            </>
                        ) : (
                            <div className={styles.itemsEmpty}>Пользователи не найдены</div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
