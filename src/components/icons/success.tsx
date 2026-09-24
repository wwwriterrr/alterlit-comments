import type { FC } from "react";

export const SuccessIcon: FC<TIconProps> = ({ size=24, fill="#000", strokeWidth=2 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.5 2L14.1236 3.916L17.3715 3.91L18.3689 7.004L21 8.91L19.9906 12L21 15.09L18.3689 16.996L17.3715 20.09L14.1236 20.084L11.5 22L8.8764 20.084L5.62849 20.09L4.63109 16.996L2 15.09L3.00938 12L2 8.91L4.63109 7.004L5.62849 3.91L8.8764 3.916L11.5 2Z" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.00386 12L10.5011 14.5L15.4956 9.5" stroke={fill} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)
