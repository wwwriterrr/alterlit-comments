import type { FC } from "react";

export const OkIcon: FC<TIconProps> = ({ size = 24, fill = '#000' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8.69325 20L1 12.4158L2.92331 10.5198L8.69325 16.2079L21.0767 4L23 5.89605L8.69325 20Z" fill={fill} />
    </svg>
)
