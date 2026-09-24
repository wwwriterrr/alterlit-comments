import { useCallback, useEffect, useState, type FC } from "react";
import styles from "./mention.module.css";
import { useAppDispatch } from "../../../services/store";
import { CommentsUserAutocomplete } from "../../../services/comments/actions";
import { LoaderSpinnerIcon } from "../../icons/loader";

const MentionItem: FC<{ item: TAutocompleteUser, onItemSelect?: (user: TAutocompleteUser) => void }> = ({ item, onItemSelect }) => {
    const clickHandler = useCallback(() => {
        onItemSelect?.(item);
    }, [onItemSelect, item])

    console.log(item);

    return (
        <div className={styles.item}>
            <button type="button" onClick={clickHandler}>{item.name}</button>
        </div>
    )
}

export const CommentFormMention: FC<{ query: string, onItemSelect?: (user: TAutocompleteUser) => void }> = ({ query, onItemSelect }) => {
    const [pending, setPending] = useState<boolean>(false);
    const [items, setItems] = useState<TAutocompleteUser[]>([]);

    const dispatch = useAppDispatch();

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const timeout = setTimeout(() => {
            setPending(true);
            dispatch(CommentsUserAutocomplete({q: query}))
                .unwrap()
                .then(data => {
                    setItems(data.objects);
                })
                .finally(() => setPending(false))
        }, 300)

        return () => {
            clearTimeout(timeout);
            if(!signal.aborted) controller.abort();
        }
    }, [query, dispatch])

    if (!query) {
        return null;
    }

    return (
        <div className={styles.mention}>
            {query ? (
                <div className={styles.list}>
                    {pending ? (
                        <div className={styles.item_loader}>
                            <LoaderSpinnerIcon size={20} fill="#444" />
                        </div>
                    ) : (
                        <>
                            {items.length ? (
                                <>
                                    {items.map((item, i) => (
                                        <MentionItem
                                            item={item}
                                            onItemSelect={onItemSelect}
                                            key={`mention_item-${i}`}
                                        />
                                    ))}
                                </>
                            ) : (
                                <div className={styles.item_empty}>По вашему запросу не нашлось результатов</div>
                            )}
                        </>
                    )}
                </div>
            ) : null}
            <div className={styles.help}>Вместо пробела используйте нижнее подчеркивание</div>
        </div>
    )
}
