import { useCallback, useRef, useState, type CSSProperties, type FC } from 'react';
import styles from './styles.module.css';
import { Editor } from '@tinymce/tinymce-react';
// import { Editor as TinyMCEEditor } from 'tinymce';
import { type EventHandler } from '@tinymce/tinymce-react/lib/cjs/main/ts/Events';
// import { type Events } from 'tinymce';
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

type TEditorEventHandler<K extends keyof Events.EditorEventMap> = EventHandler<Events.EditorEventMap[K]>;

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

    const editorRef = useRef(null);

    const changeHandler = (newContent: string) => {
        setValue(newContent);

        const lastWord = getLastWord();
        if (/\B@\w*/.test(lastWord)) {
            // Show mention
            setShowMention(true);
            setMentionQuery(lastWord.replace('@', ''));
        } else {
            // Close mention
            setShowMention(false);
            setMentionQuery('');
        }
    }

    const initHindler: TEditorEventHandler<'init'> = (_, editor) => {
        editorRef.current = editor;
    }

    const submitHandler = () => {
        if (!postId) return;
        if (!value) return;

        const clean = (content: string) => {
            content = content.replace(/(?:<p>\s*<\/p>\s*)+/gi, '');
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
        }))
            .unwrap()
            .then(() => {
                setValue('');
                onSuccess?.();
            })
            .finally(() => setPending(false));
    }

    return (
        <div
            className={`${styles.wrap} ${className}`}
            style={{
                paddingLeft: replyTo ? 80 : undefined,
                ...style,
            }}
        >
            {showMention ? (
                <CommentFormMention query={mentionQuery} />
            ) : null}
            {attach.length ? (
                <div className={styles.attach}>
                    {attach.map((item) => (
                        <div className={styles.attach__item} key={`editor_attach-${item.id}`}>
                            <img src={`${HostURL}${item.url}`} alt={`Image ${item.id}`} />
                        </div>
                    ))}
                </div>
            ) : null}
            <button className={`${styles.btn} ${styles.attachBtn}`}>
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
                        valid_elements: 'p[style],strong/b,em,span[style],a[href|target=_blank]',
                        valid_styles: {
                            '*': 'font-size,font-family,font-style,font-weight,color,text-decoration,text-align,margin,padding',
                        },
                        // forced_root_block: 'div',
                        content_style: 'body{font-size: 16px;} .mce-content-body p{margin: 0 0 14px 0;font-size: .9em;line-height: 1.2em;} .mce-content-body p:last-child{margin-bottom: 0;} .mce-content-body a[data-user]{color: #0079f0;}',
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
