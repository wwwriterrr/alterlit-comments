
declare global {
    type TCommentsPerms = {
        comments_list: boolean,
        comments_send: boolean,
        comments_list_detail: string,
        comments_send_detail: string,
    }

    interface IAuthUser {
        id: number,
        access: string,
        refresh: string,
        perms: string[],
    }

    type TIconProps = {
        size?: number | string;
        width?: number | string;
        height?: number | string;
        fill?: string;
        strokeWidth?: number;
        classes?: string;
        style?: React.CSSProperties;
    };

    interface IUser {
        id: number;
        name: string;
        avatar: string | null;
        is_staff: boolean;
        username: string;
        groups: string[];
    }

    type TAutocompleteUser = Omit<IUser, 'is_staff' | 'groups'>

    interface ICommentImage {
        id: number;
        url: string;
        preview: string;
    }

    interface IComment {
        id: number;
        dt: string | number;
        dt_modified: string | number | null,
        author: IUser;
        content: string;
        images?: ICommentImage[];
        on_comment?: number;
        reply?: IComment[];
        likes?: number[];
    }

    enum WsMessageTypes {
        new_comment = 'new_comment',
        change_comment = 'change_comment',
        remove_comment = 'remove_comment',
        like_comment = 'like_comment',
        dislike_comment = 'dislike_comment',
    }

    interface IWsMessageBase {
        type: 'chat.message',
        message: {
            type: WsMessageTypes,
        }
    }

    interface IWsNewCommentMessage extends IWsMessageBase {
        message: {
            type: WsMessageTypes.new_comment,
            comment: IComment,
        }
    }

    interface IWsChangeCommentMessage extends IWsMessageBase {
        message: {
            type: WsMessageTypes.change_comment,
            comment: IComment,
        }
    }

    interface IWsRemoveCommentMessage extends IWsMessageBase {
        message: {
            type: WsMessageTypes.remove_comment,
            comment_id: number,
            on_comment?: number,
        }
    }

    interface IWsLikeCommentMessage extends IWsMessageBase {
        message: {
            type: WsMessageTypes.like_comment,
            comment_id: number,
            user_id: number,
        }
    }

    interface IWsDislikeCommentMessage extends IWsMessageBase {
        message: {
            type: WsMessageTypes.dislike_comment,
            comment_id: number,
            user_id: number,
        }
    }

    type IWsMessage = IWsNewCommentMessage
        | IWsChangeCommentMessage
        | IWsRemoveCommentMessage
        | IWsLikeCommentMessage
        | IWsDislikeCommentMessage

    interface IAppImage {
        id: number,
        url: string,
        preview: string,
    }
}
