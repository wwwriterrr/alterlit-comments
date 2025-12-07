import { AnimatePresence, motion } from 'motion/react';
import type { FC, ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { getViewerOpen, getViewerCurrentImage, getViewerLayoutId, closeViewer } from '../../services/viewer/slice';
import styles from './styles.module.css';
import { CloseIcon } from '../../components/icons/close';
import { useEffect } from 'react';

const Viewer = () => {
    const dispatch = useAppDispatch();
    const currentImage = useAppSelector(getViewerCurrentImage);
    const layoutId = useAppSelector(getViewerLayoutId);

    const handleClose = () => {
        dispatch(closeViewer());
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!currentImage) return null;

    return (
        <motion.div 
            className={styles.wrap}
            onClick={handleOverlayClick}
            // initial={{ opacity: 0 }}
            // animate={{ opacity: 1 }}
            // exit={{ opacity: 0 }}
            // transition={{ duration: 0.3 }}
        >
            <motion.div 
                className={styles.overlay}
                // initial={{ opacity: 0 }}
                // animate={{ opacity: 1 }}
                // exit={{ opacity: 0 }}
                // transition={{ duration: 0.2 }}
            />
            <button 
                className={styles.closeButton}
                onClick={handleClose}
                aria-label="Закрыть просмотр"
            >
                <CloseIcon size={30} fill="#fff" />
            </button>
            <motion.div 
                className={styles.viewer}
                // initial={{ scale: 0.8, opacity: 0 }}
                // animate={{ scale: 1, opacity: 1 }}
                // exit={{ scale: 0.8, opacity: 0 }}
                // transition={{ 
                //     duration: 0.3,
                //     ease: [0.25, 0.46, 0.45, 0.94]
                // }}
            >
                <motion.img
                    src={`${currentImage.url}`}
                    alt={`Image ${currentImage.id}`}
                    className={styles.image}
                    layoutId={layoutId}
                    // initial={{ scale: 0.9 }}
                    // animate={{ scale: 1 }}
                    // transition={{ 
                    //     duration: 0.4,
                    //     ease: [0.25, 0.46, 0.45, 0.94]
                    // }}
                    onError={(e) => {
                        // Fallback to preview if main image fails
                        if (currentImage.preview && e.currentTarget.src !== currentImage.preview) {
                            e.currentTarget.src = currentImage.preview;
                        }
                    }}
                />
            </motion.div>
        </motion.div>
    );
};

export const ViewerProvider: FC<{children?: ReactElement}> = ({children}) => {
    const isViewerOpen = useAppSelector(getViewerOpen);

    return (
        <>
            {children}
            <AnimatePresence mode="wait">
                {isViewerOpen ? <Viewer /> : null}
            </AnimatePresence>
        </>
    );
};