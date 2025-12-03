import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import styles from './styles.module.css';
import { AttachModalSkeleton } from './skeleton';
import { useAppDispatch } from '../../../services/store';
import { CommentsFetchImages } from '../../../services/comments/actions';
import { HostURL } from '../../../core/constants';

type TSubmitHandler = (images: IAppImage[]) => void;
type TClickHandler = (item: IAppImage) => void;

const AttachItem: FC<{ item: IAppImage, onItemClick: TClickHandler, selected: IAppImage[] }> = ({ item, selected, onItemClick }) => {
    const [src, setSrc] = useState<string>(`${HostURL}${item.preview}`);

    const isSelected = useMemo(() => selected.find(i => i.id === item.id), [selected, item.id]);

    useEffect(() => {
        const img = new Image();

        const handler = () => {
            setSrc(`${HostURL}${item.url}`);
        }

        img.addEventListener('load', handler);

        img.src = `${HostURL}${item.url}`;

        return () => {
            img.removeEventListener('load', handler)
        }
    }, [item.url])

    return (
        <div className={`${styles.item} ${isSelected ? styles.item_selected : ''}`} key={`attach_image-${item.id}`} onClick={() => onItemClick(item)}>
            <img src={src} alt={`Attach item ${item.id}`} />
        </div>
    )
}

type TProps = {
    multiple?: boolean,
    buttonLabel?: string,
    onSubmit?: TSubmitHandler,
    attachLimit?: number,
}

export const AttachModal: FC<TProps> = ({ multiple = false, buttonLabel = 'Прикрепить', onSubmit, attachLimit=10 }) => {
    const [items, setItems] = useState<IAppImage[]>([]);
    const [pending, setPending] = useState<boolean>(false);
    const [selected, setSelected] = useState<IAppImage[]>([]);

    const dispatch = useAppDispatch();

    const clickHandler = useCallback((item: IAppImage) => {
        const exist = selected.find(i => i.id === item.id);

        if(exist){
            setSelected(oldItems => {
                const newItems = Array.from(oldItems);
                const index = newItems.indexOf(exist);
                newItems.splice(index, 1);
                return newItems;
            })
        }else{
            if(selected.length === attachLimit) return;

            if(multiple){
                setSelected([...selected, item]);
            }else{
                setSelected([item]);
            }
        }
    }, [selected, multiple, attachLimit])

    const handleSubmit = useCallback(() => {
        onSubmit?.(selected);
    }, [onSubmit, selected])

    const submitDisabled = useMemo(() => selected.length > attachLimit || selected.length === 0, [selected.length, attachLimit])

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPending(true);
        dispatch(CommentsFetchImages({ signal }))
            .unwrap()
            .then(data => {
                setItems(data.images);
            })
            .finally(() => setPending(false))

        return () => {
            if (!signal.aborted) controller.abort();
        }
    }, [])

    return (
        <div className={styles.wrap}>
            {pending ? (
                <AttachModalSkeleton />
            ) : (
                <div className={styles.list}>
                    {items.map(item => (
                        <AttachItem
                            item={item}
                            selected={selected}
                            key={`attach_image-${item.id}`}
                            onItemClick={clickHandler}
                        />
                    ))}
                </div>
            )}
            <div className={styles.manage}>
                <button 
                    className={styles.submitBtn} 
                    type="button" 
                    onClick={handleSubmit}
                    disabled={submitDisabled}
                >{buttonLabel}</button>
            </div>
        </div>
    )
}
