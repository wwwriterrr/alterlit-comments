import type { FC } from "react";

export const CloseIcon: FC<TIconProps> = ({ size = 24, fill = '#000' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.2 23L1 20.8L9.8 12L1 3.2L3.2 1L12 9.8L20.8 1L23 3.2L14.2 12L23 20.8L20.8 23L12 14.2L3.2 23Z" fill={fill} />
    </svg>
)
