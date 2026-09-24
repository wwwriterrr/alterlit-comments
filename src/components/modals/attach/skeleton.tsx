import styles from './styles.module.css';

export const AttachModalSkeleton = () => {
    return (
        <div className={styles.skeleton}>
            {[0,1,2,3,4,5,6,7,8].map(i => (
                <div className={styles.skeleton__item} key={`skeleton-${i}`} />
            ))}
        </div>
    )
}
