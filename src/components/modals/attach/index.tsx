import { useCallback, useEffect, useMemo, useState, type ChangeEventHandler, type FC } from 'react';
import styles from './styles.module.css';
import { AttachModalSkeleton } from './skeleton';
import { useAppDispatch } from '../../../services/store';
import { CommentsFetchImages, CommentUpload } from '../../../services/comments/actions';
import { HostURL } from '../../../core/constants';
import { LoaderSpinnerIcon } from '../../icons/loader';
import { ErrorIcon } from '../../icons/error';
import { UploadIcon } from '../../icons/upload';

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

export const AttachModal: FC<TProps> = ({ multiple = false, buttonLabel = 'Прикрепить', onSubmit, attachLimit = 10 }) => {
    const [items, setItems] = useState<IAppImage[]>([]);
    const [more, setMore] = useState<boolean>(false);
    const [pending, setPending] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [inlineError, setInlineError] = useState<string | null>(null);
    const [morePending, setMorePending] = useState<boolean>(false);
    const [uploadPending, setUploadPending] = useState<boolean>(false);
    const [selected, setSelected] = useState<IAppImage[]>([]);

    const dispatch = useAppDispatch();

    const clickHandler = useCallback((item: IAppImage) => {
        const exist = selected.find(i => i.id === item.id);

        if (exist) {
            setSelected(oldItems => {
                const newItems = Array.from(oldItems);
                const index = newItems.indexOf(exist);
                newItems.splice(index, 1);
                return newItems;
            })
        } else {
            if (selected.length === attachLimit) return;

            if (multiple) {
                setSelected([...selected, item]);
            } else {
                setSelected([item]);
            }
        }
    }, [selected, multiple, attachLimit])

    const handleSubmit = useCallback(() => {
        onSubmit?.(selected);
    }, [onSubmit, selected])

    const submitDisabled = useMemo(() => selected.length > attachLimit || selected.length === 0, [selected.length, attachLimit])

    const moreClickHandler = useCallback(() => {
        if (!more) return;

        setMorePending(true);
        dispatch(CommentsFetchImages({ lastId: items[items.length - 1].id }))
            .unwrap()
            .then(data => {
                setItems([...items, ...data.images]);
                setMore(data.more);
            })
            .finally(() => setMorePending(false))
    }, [dispatch, items, more])

    const handleUpload = useCallback<ChangeEventHandler<HTMLInputElement>>((e) => {
        const input = e.target as HTMLInputElement;
        const files = input.files;

        if(!files) return;

        if(files?.length > 5){
            setInlineError('Не больше 5 файлов');
            setTimeout(() => setInlineError(null), 2000);
            return;
        }

        console.log('upload', Array.from(files));

        setUploadPending(true);
        dispatch(CommentUpload({files: Array.from(files)}))
            .unwrap()
            .then(files => {
                const newFiles = files.map(item => item[1]);
                setItems([...newFiles, ...items]);
            })
            .finally(() => setUploadPending(false))
    }, [dispatch, items])

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setError(null);
        setPending(true);
        dispatch(CommentsFetchImages({ signal }))
            .unwrap()
            .then(data => {
                setItems(data.images);
                setMore(data.more);
                setError(null);
            })
            .catch(() => {
                setError('Возникла непредвиденная ошибка. Повторите попытку позже.')
            })
            .finally(() => setPending(false))

        return () => {
            if (!signal.aborted) controller.abort();
            setError(null);
        }
    }, [])

    return (
        <div className={styles.wrap}>
            {error ? (
                <div className={styles.error}>
                    <ErrorIcon size={80} fill="#D78778" />
                    <span>{error}</span>
                </div>
            ) : (
                <>
                    {pending ? (
                        <AttachModalSkeleton />
                    ) : (
                        <>
                        {inlineError ? (
                            <div className={styles.inlineError}>{inlineError}</div>
                        ) : null}
                        <div className={styles.list}>
                            <label className={styles.uploadBtn} title="Загрузить файлы на сервер">
                                <input type="file" multiple accept="image/*" style={{display: 'none'}} onChange={handleUpload} />
                                {uploadPending ? (
                                    <LoaderSpinnerIcon size={32} fill="#0079f0" />
                                ) : (
                                    <UploadIcon size={32} fill="#0079f0" />
                                )}
                            </label>
                            {items.map(item => (
                                <AttachItem
                                    item={item}
                                    selected={selected}
                                    key={`attach_image-${item.id}`}
                                    onItemClick={clickHandler}
                                />
                            ))}
                            {more ? (
                                <button type="button" className={styles.moreBtn} onClick={moreClickHandler}>
                                    {morePending ? (
                                        <LoaderSpinnerIcon size={24} fill='#444' />
                                    ) : (
                                        <>...</>
                                    )}
                                </button>
                            ) : null}
                        </div>
                        </>
                    )}
                    <div className={styles.manage}>
                        <div className={styles.manage__text}>
                            {attachLimit ? `Выберите не более ${attachLimit} объектов` : null}
                        </div>
                        <button
                            className={styles.submitBtn}
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitDisabled}
                        >{buttonLabel}</button>
                    </div>
                </>)}
        </div>
    )
}
