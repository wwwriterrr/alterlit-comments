import type { FC } from "react";

export const UploadIcon: FC<TIconProps> = ({ size = 24, fill = '#000' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.625 17.5V6.29375L7.05 9.86875L5.125 7.875L12 1L18.875 7.875L16.95 9.86875L13.375 6.29375V17.5H10.625ZM1 23V16.125H3.75V20.25H20.25V16.125H23V23H1Z" fill={fill} />
    </svg>
)
