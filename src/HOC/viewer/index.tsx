import { AnimatePresence, motion } from 'motion/react';
import type { FC, ReactElement } from 'react';
import { useAppDispatch, useAppSelector } from '../../services/store';
import { getViewerOpen, getViewerCurrentImage, closeViewer } from '../../services/viewer/slice';
import styles from './styles.module.css';
import { CloseIcon } from '../../components/icons/close';
import { useEffect } from 'react';
import { HostURL } from '../../core/constants';

const Viewer = () => {
    const dispatch = useAppDispatch();
    const currentImage = useAppSelector(getViewerCurrentImage)!;
    const isViewerOpen = useAppSelector(getViewerOpen);

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

        if (isViewerOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isViewerOpen]);

    useEffect(() => {
        if (isViewerOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [isViewerOpen]);

    if (!currentImage) return null;

    return (
        <motion.div 
            className={styles.wrap}
            onClick={handleOverlayClick}
            key="viewer"
        >
            <motion.div 
                key="viewer-overlay"
                className={styles.overlay}
                onClick={handleClose}
                initial={{
                    height: 0,
                }}
                animate={{
                    height: '100%',
                }}
                exit={{
                    height: 0,
                }}
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
            >
                <motion.img
                    key="viewer-image"
                    src={`${HostURL}${currentImage.url}`}
                    alt={`Image ${currentImage.id}`}
                    className={styles.image}
                    onError={(e) => {
                        // Fallback to preview if main image fails
                        if (currentImage.preview && e.currentTarget.src !== currentImage.preview) {
                            e.currentTarget.src = currentImage.preview;
                        }
                    }}
                    initial={{
                        opacity: 0,
                        y: 100,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    exit={{
                        opacity: 0,
                        y: -100
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
            <AnimatePresence>
                {isViewerOpen ? <Viewer key="viewer-wrap"/> : null}
            </AnimatePresence>
        </>
    );
};