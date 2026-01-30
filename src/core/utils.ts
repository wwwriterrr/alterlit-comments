export const translateRu = (str: string) => {
    // Implementation for Russian translation

    switch (str) {
        case 'Unnamed error.':
            return 'Непредвиденная ошибка.';
        case 'Comments closed.':
            return 'Комментарии закрыты.';
        case 'Permission denied':
            return 'Доступ запрещен.';
        case 'You need to log in to the system':
            return 'Вам нужно войти в систему.';
        case 'To leave comments, you need to specify your nickname in the profile settings.':
            return 'Чтобы оставлять комментарии, укажите ваш никнейм в настройках профиля.';
        case 'User is blocked.':
            return 'Пользователь заблокирован.';
        case 'The author of the post forbade you to leave comments.':
            return 'Автор поста запретил вам оставлять комментарии.';
        case 'Unnamed error. Code 1.':
            return 'Непредвиденная ошибка. Код 1.';
        default:
            return str;
    }
}
