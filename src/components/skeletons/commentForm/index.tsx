import type { CSSProperties, FC } from 'react';
import styles from './styles.module.css';

export const CommentFormSkeleton: FC<{style?: CSSProperties}> = ({style}) => {
    return (
        <div className={styles.wrap} style={style}>
            <div className={styles.av}></div>
            <div className={styles.form}></div>
            <div className={styles.send}></div>
        </div>
    )
}
