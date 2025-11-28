declare global {
    type TIconProps = {
        size?: number | string,
        width?: number | string,
        height?: number | string,
        fill?: string,
        strokeWidth?: number,
        classes?: string,
        style?: React.CSSProperties,
    }

    interface IUser {
        id: number,
        name: string,
        avatar: string | null,
        is_staff: boolean,
        username: string,
        groups: string[],
    }

    interface IComment {
        id: number;
        dt: string | number;
        author: IUser;
        content: string;
        on_comment?: number;
        reply: IComment[];
    }
}