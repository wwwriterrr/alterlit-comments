import { lazy, Suspense, type ComponentProps, type FC } from 'react';
import { CommentFormSkeleton } from '../../skeletons/commentForm';

// Форма — отдельный чанк: с ней приезжают MUI, обёртка TinyMCE и окна вложений/упоминаний.
// Читателю без права писать они не нужны, а вошедшему форма появляется сразу после списка.
const Form = lazy(() => import('./index').then((mod) => ({ default: mod.CommentForm })));

type TFormProps = ComponentProps<typeof Form>;

export const LazyCommentForm: FC<TFormProps> = (props) => (
    <Suspense fallback={<CommentFormSkeleton style={props.style} />}>
        <Form {...props} />
    </Suspense>
);
