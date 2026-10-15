import { lazy, Suspense, type FC } from 'react';
import { LoaderSpinnerIcon } from '../../icons/loader';

// Окно жалобы (с MUI TextField) — отдельный чанк, грузится при первом открытии
const SupportModal = lazy(() => import('./index').then((mod) => ({ default: mod.SupportModal })));

export const LazySupportModal: FC<{ commentId: number }> = ({ commentId }) => (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}><LoaderSpinnerIcon size={32} fill="#444" /></div>}>
        <SupportModal commentId={commentId} />
    </Suspense>
);
