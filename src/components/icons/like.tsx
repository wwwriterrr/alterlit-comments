import type { FC } from 'react';
import { motion } from 'motion/react';

export const LikeIcon: FC<TIconProps & { liked?: boolean }> = ({ size = 24, liked = false }) => (
    <motion.svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
            scale: liked ? [1, 1.7, 1.1] : 1,
            transition: liked ? {
                duration: .4,
                ease: 'easeOut',
            } : {
                duration: .1,
                ease: 'linear',
            }
        }}
    >
        <motion.path
            d="M38.2599 9.36668C39.9858 14.7288 38.5414 20.185 35.4976 24.2961C33.4884 27.0839 31.0873 29.4866 28.6324 31.5871C26.3738 33.7011 21.3195 37.8838 19.9797 38C18.7956 37.7724 17.4669 36.426 16.5268 35.733C11.2443 31.6953 5.55778 26.7851 2.67447 21.4164C0.257036 16.2622 0.252602 9.88715 4.01501 5.93558C8.89358 1.51324 16.2485 2.37737 19.9797 6.99761C20.9818 5.69053 22.214 4.66254 23.6764 3.9137C29.6048 1.53428 35.7722 3.95885 38.2599 9.36668V9.36668Z"
            animate={{
                fill: liked ? '#D78778' : '#DFD9C2',
            }}
        />
    </motion.svg>
)
