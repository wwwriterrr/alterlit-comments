import type { FC } from "react";

export const SendIcon: FC<TIconProps> = ({ size = 24, fill = "#000" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 21V3L23 12L1 21ZM3.31579 17.625L17.0368 12L3.31579 6.375V10.3125L10.2632 12L3.31579 13.6875V17.625Z" fill={fill} />
    </svg>
)
