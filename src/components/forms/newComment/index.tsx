import { useCallback, useRef, useState, type CSSProperties, type FC } from 'react';
import styles from './styles.module.css';
import { Editor } from '@tinymce/tinymce-react';
import { SendIcon } from '../../icons/send';
import { AddImageIcon } from '../../icons/addImage';
import { useAppDispatch } from '../../../services/store';
import { HostURL } from '../../../core/constants';
import { CommentsSend, CommentsUserAutocomplete } from '../../../services/comments/actions';
import { useParams } from 'react-router-dom';
import { LoaderSpinnerIcon } from '../../icons/loader';
import { openModal } from '../../../services/modal/slice';
import { AttachModal } from '../../modals/attach';
import { animateCloseModal } from '../../../services/modal/actions';
import { CloseIcon } from '../../icons/close';
import type { Editor as TinyMCEEditor } from 'tinymce';
import { isMobile } from 'react-device-detect';
import { OkIcon } from '../../icons/ok';

type TProps = {
    initialValue?: string,
    initialAttach?: ICommentImage[],
    replyTo?: number;
    editId?: number;
    className?: string;
    style?: CSSProperties;
    onSuccess?: () => void;
    onInit?: (editor: TinyMCEEditor) => void;
}

type TTinyAutocompleteItem = {
    type: 'cardmenuitem',
    value: string,
    label: string,
    items: {
        type: 'cardcontainer',
        direction: 'horizontal',
        valign: 'middle',
        items: [
            {
                type: 'cardimage',
                src: string,
                alt: string,
                classes: string[],
            },
            {
                type: 'cardtext',
                text: string
            },

        ]
    }[],
}

export const CommentForm: FC<TProps> = ({
    initialValue = '',
    initialAttach = [],
    replyTo,
    editId,
    className,
    style,
    onSuccess,
    onInit,
}) => {
    const [value, setValue] = useState<string>(initialValue);
    const [attach, setAttach] = useState<ICommentImage[]>(initialAttach);
    const [pending, setPending] = useState<boolean>(false);

    const { postId } = useParams();

    const dispatch = useAppDispatch();

    const editorRef = useRef<TinyMCEEditor>(null);

    const changeHandler = (newContent: string) => {
        setValue(newContent);
    }

    const initHindler = (_: unknown, editor: TinyMCEEditor) => {
        editorRef.current = editor;
        onInit?.(editor);
    }

    const submitHandler = () => {
        if (!postId) return;
        if (!value) return;

        const clean = (content: string) => {
            // content = content.replace(/(?:<p>\s*<\/p>\s*)+/gi, '');
            // content = content.replace(/<span>&nbsp;<\/span>/g, ' ');
            // content = content.replace(/&nbsp;/g, ' ');
            // content = content.replace(/\n+/g, '\n');
            // return content;

            if (!content) return '';

            // Быстрая предварительная нормализация, чтобы упростить парсинг
            content = content.replace(/<span[^>]*>&nbsp;<\/span>/gi, ' ');
            content = content.replace(/&nbsp;/g, ' ');

            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const body = doc.body;
                const nodes = Array.from(body.childNodes);
                const out: Node[] = [];
                let lastWasEmpty = false;

                const isEmptyParagraph = (el: HTMLElement) => {
                    // Считаем "пустым", если внутри нет видимого текста и нет значимых элементов (img, video ...)
                    // но допускаем <br> — он обозначает пустую строку.
                    const text = (el.textContent || '').replace(/\u00A0/g, ' ').trim();
                    const hasMedia = !!el.querySelector('img, video, iframe, picture, svg, [data-src]');
                    // считаем пустым, если нет текста и нет медиа; <br> допустим (будем нормализовать)
                    return !text && !hasMedia;
                }

                for (const node of nodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        // игнорируем чисто пробельные ТН
                        if (!(node.textContent || '').trim()) continue;
                        // если есть видимый текст в body как текстный узел — обернём в <p>
                        const p = doc.createElement('p');
                        p.textContent = node.textContent || '';
                        out.push(p);
                        lastWasEmpty = false;
                        continue;
                    }

                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as HTMLElement;
                        const tag = el.tagName.toLowerCase();

                        if (tag === 'p') {
                            if (isEmptyParagraph(el)) {
                                if (!lastWasEmpty) {
                                    const p = doc.createElement('p');
                                    p.innerHTML = '<br>';
                                    out.push(p);
                                    lastWasEmpty = true;
                                } // иначе игнорируем дополнительные пустые p
                            } else {
                                out.push(el.cloneNode(true));
                                lastWasEmpty = false;
                            }
                            continue;
                        }

                        // Если элемент — блок-обёртка, но внутри может быть пустой абзац и т.д.
                        // просто переносим его как есть и сбрасываем флаг пустоты
                        out.push(el.cloneNode(true));
                        lastWasEmpty = false;
                    }
                }

                // Удаляем ведущие/замыкающие пустые абзацы
                while (out.length && out[0].nodeType === Node.ELEMENT_NODE && (out[0] as Element).tagName.toLowerCase() === 'p' && !((out[0] as HTMLElement).textContent || '').trim()) {
                    out.shift();
                }
                while (out.length && out[out.length - 1].nodeType === Node.ELEMENT_NODE && (out[out.length - 1] as Element).tagName.toLowerCase() === 'p' && !((out[out.length - 1] as HTMLElement).textContent || '').trim()) {
                    out.pop();
                }

                const wrapper = doc.createElement('div');
                out.forEach(n => wrapper.appendChild(n));
                let result = wrapper.innerHTML;

                // Финальная зачистка
                result = result.replace(/<span[^>]*>&nbsp;<\/span>/gi, ' ');
                result = result.replace(/&nbsp;/g, ' ');
                result = result.replace(/\n{2,}/g, '\n');

                return result.trim();
            } catch (err) {
                console.error('Error cleaning comment content:', err);
                // Фолбэк на regex (если вдруг DOMParser недоступен)
                content = content.replace(/(?:<p>\s*<\/p>\s*)+/gi, '<p><br></p>');
                content = content.replace(/<span[^>]*>&nbsp;<\/span>/gi, ' ');
                content = content.replace(/&nbsp;/g, ' ');
                content = content.replace(/\n+/g, '\n');
                return content.trim();
            }
        }

        console.log('Submit comment:', clean(value));

        setPending(true);
        dispatch(CommentsSend({
            instanceId: postId,
            type: 'post',
            content: clean(value),
            replyTo: replyTo,
            images: attach.reduce((acc, item) => {
                acc.push(item.id);
                return acc;
            }, [] as number[]),
            editId,
        }))
            .unwrap()
            .then(() => {
                setValue('');
                setAttach([]);
                onSuccess?.();
            })
            .finally(() => setPending(false));
    }

    const handleAttachSubmit = useCallback((images: IAppImage[]) => {
        setAttach([...attach, ...images]);
        dispatch(animateCloseModal(200));
    }, [attach, dispatch])

    const handleAttachClick = useCallback(() => {
        if (attach.length >= 10) return;

        dispatch(openModal({
            content: (
                <AttachModal
                    multiple
                    onSubmit={handleAttachSubmit}
                    attachLimit={10 - attach.length}
                />
            )
        }));
    }, [attach.length, dispatch, handleAttachSubmit])

    const handleAttachRemove = useCallback((id: number) => {
        setAttach(attach.filter(item => item.id !== id));
    }, [attach])

    return (
        <div
            className={`${styles.wrap} ${className ? className : ''}`}
            style={{
                paddingLeft: replyTo ? 80 : undefined,
                ...style,
            }}
        >
            {attach.length ? (
                <div className={styles.attach}>
                    {attach.map((item, i) => (
                        <div className={styles.attach__item} key={`editor_attach_${i}-${item.id}`}>
                            <button className={styles.attach__item__remove} type="button" onClick={() => handleAttachRemove(item.id)}>
                                <CloseIcon size={10} fill="#fff" />
                            </button>
                            <img src={`${HostURL}${item.url}`} alt={`Image ${item.id}`} />
                        </div>
                    ))}
                </div>
            ) : null}
            <button
                type="button"
                className={`${styles.btn} ${styles.attachBtn}`}
                onClick={handleAttachClick}
            >
                <AddImageIcon size={24} fill="#000" />
            </button>
            <div className={`alt-comment-form ${styles.area}`} style={{
                borderColor: editId ? '#0079f0' : replyTo ? '#e3b287' : undefined
            }}>
                <Editor
                    tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.5.0/tinymce.min.js"
                    onInit={initHindler}
                    inline
                    value={value}
                    onEditorChange={changeHandler}
                    init={{
                        placeholder: 'Комментарий',
                        menubar: false,
                        /* toolbar: [
                            'undo redo | bold italic underline',
                            'forecolor backcolor | alignleft aligncenter alignright alignfull'
                        ], */
                        toolbar: false,
                        plugins: [
                            'quickbars', 'emoticons', 'autolink', 'link',
                        ],
                        // quickbars_insert_toolbar: 'emoticons',
                        quickbars_insert_toolbar: false,
                        quickbars_selection_toolbar: isMobile ? false : 'bold italic underline strikethrough | forecolor backcolor | blockquote quicklink | alignleft aligncenter alignright alignfull | removeformat',
                        valid_elements: 'p[style],strong/b,em,span[style],a[href|target=_blank],blockquote[style],s[style]',
                        valid_styles: {
                            '*': 'font-size,font-family,font-style,font-weight,color,text-decoration,text-align,margin,padding,background-color,',
                        },
                        // forced_root_block: 'div',
                        contextmenu: false,
                        content_style: `
                            .alt-comment-form{
                                font-size: 16px;
                            }
                            .alt-comment-form p{
                                margin: 0 0 10px 0;
                            }
                            .alt-comment-form p:last-child{
                                margin-bottom: 0;
                            } 
                            .alt-comment-form a[data-user]{
                                color: #0079f0;
                            } 
                            .alt-comment-form a{
                                color: #0079f0;
                                text-decoration: underline;
                            }
                            .alt-comment-form blockquote{
                                margin: 0 0 10px 0;
                                padding: 10px 20px;
                                border-left: 5px solid #dfd9c2;
                            }

                            .alt-comment-form blockquote:last-child{
                                margin: 0;
                            }
                        `,
                        // auto_focus: replyTo ? true : undefined,
                        setup: (editor: TinyMCEEditor) => {
                            const onAction = (autocompleteApi: { hide: () => void }, rng: Range, value: string) => {
                                editor.selection.setRng(rng);
                                editor.insertContent(value);
                                autocompleteApi.hide();
                            };

                            let acTimer: number | null = null;
                            let lastRequestId = 0;

                            const debouncedFetch = (pattern: string) => {
                                lastRequestId += 1;
                                const requestId = lastRequestId;

                                return new Promise<TTinyAutocompleteItem[]>(resolve => {
                                    if (acTimer) window.clearTimeout(acTimer);
                                    acTimer = window.setTimeout(async () => {
                                        acTimer = null;
                                        try {
                                            const { objects } = await dispatch(CommentsUserAutocomplete({ q: pattern })).unwrap();
                                            // если за это время пришёл новый запрос — отваливаем результат
                                            if (requestId !== lastRequestId) {
                                                resolve([]);
                                                return;
                                            }
                                            const results = objects.map(item => ({
                                                type: 'cardmenuitem' as const,
                                                value: `<a href="${HostURL}/profile/${item.username}/" target="_blank">${item.name}</a>`,
                                                label: item.name,
                                                items: [
                                                    {
                                                        type: 'cardcontainer' as const,
                                                        direction: 'horizontal' as const,
                                                        valign: 'middle' as const,
                                                        items: [
                                                            {
                                                                type: 'cardimage' as const,
                                                                src: `${HostURL}${item.avatar}`,
                                                                alt: item.name,
                                                                classes: ['tiny-autocomplete-item']
                                                            },
                                                            {
                                                                type: 'cardtext' as const,
                                                                text: item.name
                                                            },
                                                        ]
                                                    }
                                                ]
                                            } as TTinyAutocompleteItem));
                                            resolve(results);
                                        } catch (err) {
                                            console.error('Error with user autocomplete', err)
                                            resolve([]); // на ошибке возвращаем пустой список
                                        }
                                    }, 200);
                                });
                            };

                            editor.ui.registry.addAutocompleter('specialchars', {
                                trigger: '@',
                                minChars: 1,
                                columns: 'auto',
                                onAction: onAction,
                                fetch: (pattern) => debouncedFetch(pattern),
                            })
                        },
                    }}
                />
            </div>
            <button
                className={`${styles.btn} ${styles.submitBtn}`}
                onClick={submitHandler}
                disabled={!value.trim() || pending}
            >
                {pending ? (
                    <LoaderSpinnerIcon size={24} fill="#fff" />
                ) : (
                    <>
                        {editId ? (
                            <OkIcon size={24} fill="#fff" />
                        ) : (
                            <SendIcon size={24} fill="#fff" />
                        )}
                    </>
                )}
            </button>
        </div>
    )
}
