import { useCallback, useEffect, useState, type FC } from "react";
import styles from "./mention.module.css";

const MentionItem: FC<{ item: unknown, onItemSelect?: () => void }> = ({ item, onItemSelect }) => {
    const clickHandler = useCallback(() => {
        onItemSelect?.();
    }, [onItemSelect])

    console.log(item);

    return (
        <div className={styles.item} onClick={clickHandler}>

        </div>
    )
}

export const CommentFormMention: FC<{ query: string, onItemSelect?: () => void }> = ({ query, onItemSelect }) => {
    const [pending, setPending] = useState<boolean>(false);
    const [items, setItems] = useState<[]>([]);

    useEffect(() => {
        
    }, [query])

    if (!query) {
        return null;
    }

    return (
        <div className={styles.mention}>
            {query ? (
                <div className={styles.list}>
                    {pending ? (
                        <div className={styles.item_loader}></div>
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
                                <div className={styles.item_empty}></div>
                            )}
                        </>
                    )}
                </div>
            ) : (
                <div className={styles.empty}>Начните вводить имя пользователя</div>
            )}
            <div className={styles.help}>Вместо пробела используйте нижнее подчеркивание</div>
        </div>
    )
}
