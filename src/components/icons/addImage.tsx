import type { FC } from "react";

export const AddImageIcon: FC<TIconProps> = ({ size = 24, fill = "#000" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3.23529 4.25H17.7647V12.125H20V4.25C20 3.00912 18.9975 2 17.7647 2H3.23529C2.00253 2 1 3.00912 1 4.25V17.75C1 18.9909 2.00253 20 3.23529 20H12.1765V17.75H3.23529V4.25Z" fill={fill} />
        <path d="M7.27273 11L4 15H16L11.6364 9L8.36364 13L7.27273 11Z" fill={fill} />
        <path d="M19.625 14H17.375V17.375H14V19.625H17.375V23H19.625V19.625H23V17.375H19.625V14Z" fill={fill} />
    </svg>
)
