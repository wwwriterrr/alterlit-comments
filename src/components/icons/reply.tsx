import type { FC } from "react";

export const ReplyIcon: FC<TIconProps> = ({ size = 24, fill = '#000' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.5556 21V15.8571C20.5556 14.7857 20.1991 13.875 19.4861 13.125C18.7731 12.375 17.9074 12 16.8889 12H5.675L10.075 16.6286L8.33333 18.4286L1 10.7143L8.33333 3L10.075 4.8L5.675 9.42857H16.8889C18.5796 9.42857 20.021 10.0556 21.2131 11.3096C22.4052 12.5636 23.0008 14.0794 23 15.8571V21H20.5556Z" fill={fill} />
    </svg>
)
