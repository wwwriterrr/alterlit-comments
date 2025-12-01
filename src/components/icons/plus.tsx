import type { FC } from "react";

export const PlusIcon: FC<TIconProps> = ({ size = 24, fill = "#000" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.4286 13.5714H1V10.4286H10.4286V1H13.5714V10.4286H23V13.5714H13.5714V23H10.4286V13.5714Z" fill={fill} />
    </svg>
)
