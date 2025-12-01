import { useCallback, useRef, useState, type CSSProperties, type FC } from 'react';
import styles from './styles.module.css';
import { Editor } from '@tinymce/tinymce-react';
// import { Editor as TinyMCEEditor } from 'tinymce';
import { type EventHandler } from '@tinymce/tinymce-react/lib/cjs/main/ts/Events';
// import { type Events } from 'tinymce';
import { getLastWord } from './utils';
import { SendIcon } from '../../icons/send';
import { AddImageIcon } from '../../icons/addImage';
import { useAppSelector } from '../../../services/store';
import { getComment, type IInitialState } from '../../../services/comments/slice';
import { HostURL } from '../../../core/constants';

type TEditorEventHandler<K extends keyof Events.EditorEventMap> = EventHandler<Events.EditorEventMap[K]>;

type TProps = {
    replyTo?: number;
    editId?: number;
    className?: string;
    style?: CSSProperties;
}

export const CommentForm: FC<TProps> = ({ replyTo, editId, className, style }) => {
    const comment = useAppSelector((state: {comments: IInitialState}) => getComment(state, editId || 0));

    const [value, setValue] = useState<string>(comment ? comment.content : '');
    const [attach, setAttach] = useState<ICommentImage[]>(comment ? comment.images || [] : []);

    const editorRef = useRef(null);

    const changeHandler = (newContent: string) => {
        setValue(newContent);
    }

    const initHindler: TEditorEventHandler<'init'> = (_, editor) => {
        editorRef.current = editor;
    }

    const inputHandler: TEditorEventHandler<'input'> = () => {
        const lastWord = getLastWord();
        if (/\B@\w*/.test(lastWord)) {
            // Show mention
            console.log('Show mention');
        } else {
            // Close mention
            console.log('Close mention');
        }
    }

    const submitHandler = useCallback(() => {
        console.log('Submit comment:', value);
    }, [value])

    return (
        <div 
            className={`${styles.wrap} ${className}`} 
            style={{ 
                paddingLeft: replyTo ? 80 : undefined,
                ...style,
            }}
        >
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
                    onInput={inputHandler}
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
                disabled={!value.trim()}
            >
                <SendIcon size={24} fill="#000" />
            </button>
        </div>
    )
}
