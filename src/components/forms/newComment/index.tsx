import { useCallback, useRef, useState, type CSSProperties, type FC } from 'react';
import styles from './styles.module.css';
import { Editor } from '@tinymce/tinymce-react';
import { getLastWord } from './utils';
import { SendIcon } from '../../icons/send';
import { AddImageIcon } from '../../icons/addImage';
import { useAppDispatch, useAppSelector } from '../../../services/store';
import { getComment, type IInitialState } from '../../../services/comments/slice';
import { HostURL } from '../../../core/constants';
import { CommentFormMention } from './mention';
import { CommentsSend } from '../../../services/comments/actions';
import { useParams } from 'react-router-dom';
import { LoaderSpinnerIcon } from '../../icons/loader';
import { openModal } from '../../../services/modal/slice';
import { AttachModal } from '../../modals/attach';
import { animateCloseModal } from '../../../services/modal/actions';
import { CloseIcon } from '../../icons/close';
import type { Editor as TinyMCEEditor } from 'tinymce';

type TProps = {
    replyTo?: number;
    editId?: number;
    className?: string;
    style?: CSSProperties;
    onSuccess?: () => void;
}

export const CommentForm: FC<TProps> = ({ replyTo, editId, className, style, onSuccess }) => {
    const comment = useAppSelector((state: { comments: IInitialState }) => getComment(state, editId || 0));

    const [value, setValue] = useState<string>(comment ? comment.content : '');
    const [attach, setAttach] = useState<ICommentImage[]>(comment ? comment.images || [] : []);
    const [showMention, setShowMention] = useState<boolean>(false);
    const [mentionQuery, setMentionQuery] = useState<string>('');
    const [pending, setPending] = useState<boolean>(false);

    const { postId } = useParams();

    const dispatch = useAppDispatch();

    const editorRef = useRef<TinyMCEEditor>(null);

    const changeHandler = (newContent: string) => {
        setValue(newContent);

        const lastWord = getLastWord();
        if (/\B@\w*/.test(lastWord)) {
            // Show mention
            setShowMention(true);
            setMentionQuery(lastWord);
        } else {
            // Close mention
            setShowMention(false);
            setMentionQuery('');
        }
    }

    const initHindler = (_: unknown, editor: TinyMCEEditor) => {
        console.log(_);
        editorRef.current = editor;
    }

    const submitHandler = () => {
        if (!postId) return;
        if (!value) return;

        const clean = (content: string) => {
            content = content.replace(/(?:<p>\s*<\/p>\s*)+/gi, '');
            content = content.replace(/<span>&nbsp;<\/span>/g, ' ');
            content = content.replace(/&nbsp;/g, ' ');
            content = content.replace(/\n+/g, '\n');
            return content;
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

    const handleMentionSelect = useCallback((user: TAutocompleteUser) => {
        if (!editorRef.current) return;

        const content = editorRef.current.getContent() as string;
        const href = `${HostURL}/profile/${user.username}/`;
        const newContent = content.replace(mentionQuery, `<a href="${href}">${user.name}</a><span>&nbsp;</span>`);

        setValue(newContent);

        setTimeout(() => {
            try {
                const node = editorRef.current?.dom.select(`a[href="${href}"] + span`);
                if(node){
                    editorRef.current?.selection.setCursorLocation(node[0].firstChild as Node, 1);
                    editorRef.current?.focus();
                }
            } catch (err) {
                console.log('Error with set cursor', err);
            }
        }, 100);

    }, [mentionQuery])

    const handleAttachSubmit = useCallback((images: IAppImage[]) => {
        setAttach([...attach, ...images]);
        dispatch(animateCloseModal(200));
    }, [attach, dispatch])

    const handleAttachClick = useCallback(() => {
        if(attach.length >= 10) return;

        dispatch(openModal({content: (
            <AttachModal
                multiple 
                onSubmit={handleAttachSubmit} 
                attachLimit={10 - attach.length}
            />
        )}));
    }, [attach.length, dispatch, handleAttachSubmit])

    const handleAttachRemove = useCallback((id: number) => {
        setAttach(attach.filter(item => item.id !== id));
    }, [attach])

    return (
        <div
            className={`${styles.wrap} ${className}`}
            style={{
                paddingLeft: replyTo ? 80 : undefined,
                ...style,
            }}
        >
            {showMention ? (
                <CommentFormMention query={mentionQuery.replace('@', '').replace(/\s+$/g, '')} onItemSelect={handleMentionSelect} />
            ) : null}
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
            <div className={styles.area} style={{
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
                        quickbars_selection_toolbar: 'bold italic underline | forecolor backcolor | blockquote quicklink | alignleft aligncenter alignright alignfull',
                        valid_elements: 'p[style],strong/b,em,span[style],a[href|target=_blank],blockquote[style]',
                        valid_styles: {
                            '*': 'font-size,font-family,font-style,font-weight,color,text-decoration,text-align,margin,padding,background-color,',
                        },
                        // forced_root_block: 'div',
                        content_style: `
                            body{
                                font-size: 16px;
                            } 
                            p{
                                margin: 0 0 10px 0;
                            }
                            p:last-child{
                                margin-bottom: 0;
                            } 
                            a[data-user]{
                                color: #0079f0;
                            } 
                            a{
                                color: #0079f0;
                                text-decoration: underline;
                            }
                            blockquote{
                                margin: 0 0 10px 0;
                                padding: 10px 20px;
                                border-left: 5px solid #dfd9c2;
                            }

                            blockquote:last-child{
                                margin: 0;
                            }
                        `,
                        auto_focus: true,
                    }}
                />
            </div>
            <button
                className={`${styles.btn} ${styles.submitBtn}`}
                onClick={submitHandler}
                disabled={!value.trim() || pending}
            >
                {pending ? (
                    <LoaderSpinnerIcon size={24} fill="#000" />
                ) : (
                    <SendIcon size={24} fill="#000" />
                )}
            </button>
        </div>
    )
}
