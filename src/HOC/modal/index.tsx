import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useRef, type FC, type ReactElement } from 'react';
import { animateCloseModal } from '../../services/modal/actions';
import { getModalClass, getModalContent, getModalTitle, getModalVisible } from '../../services/modal/slice';
import { useAppDispatch, useAppSelector } from '../../services/store';
import styles from './styles.module.css';
import { CloseIcon } from '../../components/icons/close';

const Overlay = () => {
    const dispatch = useAppDispatch();

    const overlayClickHandler = () => {
        dispatch(animateCloseModal(200));
    }

    return (
        <motion.div
            className={`add-modal__overlay ${styles.overlay}`}
            onClick={overlayClickHandler}
            key="modal-overlay"
            initial={{
                opacity: 0,
            }}
            animate={{
                opacity: 1,
                transition: {
                    duration: .4,
                    ease: 'easeOut',
                }
            }}
            exit={{
                opacity: 0,
                transition: {
                    duration: .1,
                    ease: 'linear',
                }
            }}
        ></motion.div>
    )
}

const Modal = () => {
    const dispatch = useAppDispatch();

    const className = useAppSelector(getModalClass);
    const title = useAppSelector(getModalTitle);
    const content = useAppSelector(getModalContent)!;

    const closeClickHandler = () => {
        dispatch(animateCloseModal(200));
    }

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if(e.key === 'Escape'){
                dispatch(animateCloseModal(200));
            }
        }

        document.addEventListener('keydown', handler);

        return () => {
            document.removeEventListener('keydown', handler);
        }
    }, [dispatch])

    return (
        <div className={`app-modal ${styles.wrap} ${className ? className : ''}`}>
            <Overlay />
            <motion.div
                className={`app-modal__window ${styles.window}`}
                initial={{
                    opacity: 0,
                    y: 50,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    transition: {
                        duration: .3,
                        ease: 'easeOut',
                        delay: .1,
                    }
                }}
                exit={{
                    opacity: 0,
                    y: 50,
                    transition: {
                        duration: .1,
                        ease: 'linear',
                    }
                }}
            >
                <div className={`app-modal__head ${styles.head}`}>
                    <div
                        className={`app-modal__title ${styles.title}`}
                    >{title ? title : 'Alterlit'}</div>
                    <motion.button
                        className={`app-modal__close ${styles.close}`}
                        onClick={closeClickHandler}
                        initial={{
                            opacity: 0,
                            x: 10,
                        }}
                        animate={{
                            opacity: 1,
                            x: 0,
                            transition: {
                                duration: .4,
                                delay: .2,
                                ease: 'easeOut',
                            }
                        }}
                    >
                        <CloseIcon fill="#000" size={20} />
                    </motion.button>
                </div>
                <div className={`app-modal__content ${styles.content}`}>{content}</div>
            </motion.div>
        </div>
    )
}

export const ModalHOC: FC<{ children?: ReactElement }> = ({ children }) => {
    const modalVisible = useAppSelector(getModalVisible);

    const top = useRef<number>(0);

    useEffect(() => {
        const body = document.body;

        if(modalVisible){
            top.current = window.pageYOffset;
            body.style.position = 'fixed';
            body.style.top = `-${top.current}px`;
            body.style.height = '100vh';
            body.style.width = '100%';
        }else{
            body.removeAttribute('style');
            window.scrollTo(0 ,top.current);
        }
    }, [modalVisible])

    return (
        <>
            {children}
            <AnimatePresence>
                {modalVisible ? (<Modal />) : null}
            </AnimatePresence>
        </>
    )
}
