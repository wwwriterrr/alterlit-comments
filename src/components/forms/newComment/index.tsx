import { useRef, useState } from 'react';
import styles from './styles.module.css';
import { Editor } from '@tinymce/tinymce-react';
// import { Editor as TinyMCEEditor } from 'tinymce';
import { type EventHandler } from '@tinymce/tinymce-react/lib/cjs/main/ts/Events';
// import { type Events } from 'tinymce';
import { getLastWord } from './utils';

type TEditorEventHandler<K extends keyof Events.EditorEventMap> = EventHandler<Events.EditorEventMap[K]>;

export const CommentForm = () => {
    const [value, setValue] = useState<string>('');

    const editorRef = useRef(null);

    const changeHandler = (newContent: string) => {
        setValue(newContent);
    }

    const initHindler: TEditorEventHandler<'init'> = (_, editor) => {
        editorRef.current = editor;
    }

    const inputHandler: TEditorEventHandler<'input'> = () => {
        const lastWord = getLastWord();
        if(/\B@\w*/.test(lastWord)){
            // Show mention
        }else{
            // Close mention
        }
    }

    return (
        <div className={styles.wrap}>
            <Editor
                tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.5.0/tinymce.min.js"
                onInit={initHindler}
                onInput={inputHandler}
                inline
                value={value}
                onEditorChange={changeHandler}
                init={{
                    menubar: false,
                    /* toolbar: [
                        'undo redo | bold italic underline',
                        'forecolor backcolor | alignleft aligncenter alignright alignfull'
                    ], */
                    toolbar: false,
                    plugins: [
                        'quickbars', 'emoticons', 'autolink',
                    ],
                    // quickbars_insert_toolbar: 'emoticons',
                    quickbars_insert_toolbar: false,
                    quickbars_selection_toolbar: 'bold italic underline | forecolor backcolor | blockquote quicklink | alignleft aligncenter alignright alignfull',
                    valid_elements: 'p[style],strong/b,em,span[style],a[href|target=_blank]',
                    valid_styles: {
                        '*': 'font-size,font-family,font-style,font-weight,color,text-decoration,text-align,margin,padding',
                    },
                    // forced_root_block: 'div',
                    content_style: '.mce-content-body p{margin: 0 0 14px 0;font-size: .9em;line-height: 1.2em;} .mce-content-body p:last-child{margin-bottom: 0;} .mce-content-body a[data-user]{color: #0079f0;}',
                }}
            ></Editor>
        </div>
    )
}
