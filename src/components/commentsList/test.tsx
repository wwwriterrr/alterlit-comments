import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { useState } from "react";
import icon from '../../assets/react.svg';

export const TestGallery = () => {
    const [item, setItem] = useState<number | null>(null);

    const items: string[] = ['#fff', '#555', '#000', '#e3e3e3'];

    return (
        <LayoutGroup id="viewer">
            <div
                style={{
                    display: 'grid',
                    gridTemplate: '200px 200px / 200px 200px',
                    gap: 20,
                }}
            >
                {items.map((item, i) => (
                    <motion.div
                        key={`item-${i}`}
                        style={{
                            position: 'relative',
                            backgroundColor: item,
                        }}
                        layoutId={`item-${i}`}
                        onClick={() => setItem(i)}
                    >
                        <img
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                            }}
                            src={icon}
                        />
                    </motion.div>
                ))}
            </div>
            <AnimatePresence>
                {item !== null && (
                    <div
                        key="viewer"
                        style={{
                            position: 'fixed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            left: 0,
                            top: 0,
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <motion.div
                            key={'overlay'}
                            style={{
                                position: 'absolute',
                                zIndex: 1,
                                left: 0,
                                top: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: '#00000098',
                            }}
                            initial={{
                                opacity: 0,
                            }}
                            animate={{
                                opacity: 1,
                            }}
                            exit={{
                                opacity: 0,
                            }}
                            onClick={() => setItem(null)}
                        />

                        <motion.div
                            key={'image'}
                            layoutId={`item-${item}`}
                            style={{
                                position: 'fixed',
                                zIndex: 2,
                                width: 400,
                                height: 400,
                                backgroundColor: items[item],
                            }}
                            onClick={() => setItem(null)}
                        >
                            <img
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                }}
                                src={icon}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </LayoutGroup>
    )
}
