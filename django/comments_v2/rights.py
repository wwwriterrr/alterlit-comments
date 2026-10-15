"""
Права на комментарии — в одном месте. Их зовут и ручка прав (форма на фронте),
и создание/правка/удаление, поэтому форма и сервер не расходятся.
"""
from datetime import timedelta

from django.utils import timezone as tz

from blog.models import Post, PostImages

EDIT_WINDOW = timedelta(minutes=5)  # своё можно править и удалять 5 минут после отправки
MAX_COMMENT_IMAGES = 10             # как в окне вложений на фронте («до 10 шт.»)

# Что можно комментировать: тип из URL → модель. Остальные модели blog — 404,
# раньше apps.get_model позволял прицепить комментарий к любой модели приложения.
COMMENTABLE = {
    'post': Post,
    'postimages': PostImages,
}

now = tz.now  # даты в базе — по Москве без смещения, как и везде на сайте


def full_block_reason(user):
    """Полная блокировка (FULL) запрещает любые действия: лайки, правку, удаление, загрузку.
    -> причина или None. Запрет комментирования (COMMENTS) проверяет send_rights."""
    block = user.check_block() if user and user.is_authenticated else None
    return block_reason(block) if block and block.block_type == 'FULL' else None


def is_moderator(user):
    """Модератор комментариев: правит и удаляет чужое без ограничения по времени, удаляет пачкой."""
    return bool(user and user.is_authenticated and user.is_active and user.is_staff)


def get_target(content_type, object_id):
    """Объект комментариев. -> (instance | None)."""
    model = COMMENTABLE.get(content_type)
    if model is None:
        return None
    qs = model.objects.select_related('author', 'author__profile') if model is Post else model.objects
    try:
        return qs.get(pk=int(object_id))
    except (model.DoesNotExist, ValueError, TypeError):
        return None


def read_rights(target):
    """Можно ли читать комментарии. -> (bool, причина | None)."""
    if isinstance(target, Post):
        if target.status not in ('published', 'profile') or target.date > now():
            return False, 'Публикация недоступна'
        if not target.commented:
            return False, 'Комментарии к этой публикации закрыты'
    return True, None


def send_rights(user, target):
    """Можно ли оставлять комментарии (и править свои). -> (bool, причина | None)."""
    can_read, reason = read_rights(target)
    if not can_read:
        return False, reason
    if not user or not user.is_authenticated:
        return False, 'Чтобы оставлять комментарии, войдите на сайт'
    if not user.is_active:
        return False, 'Учётная запись отключена'

    profile = getattr(user, 'profile', None)
    if not (getattr(profile, 'nickname', None) or '').strip():
        return False, 'Чтобы оставлять комментарии, укажите псевдоним в настройках профиля'

    block = user.check_block()  # blocking: UserBlock (один на пользователя), None — если истекла
    if block and block.block_type in ('FULL', 'COMMENTS'):
        return False, block_reason(block)

    author = getattr(target, 'author', None)
    if isinstance(target, Post) and author and author.pk != user.pk:
        author_profile = getattr(author, 'profile', None)
        if author_profile and author_profile.blacklist.filter(pk=user.pk).exists():
            return False, 'Автор публикации запретил вам оставлять комментарии'

    return True, None


def block_reason(block):
    """«Вам запрещено оставлять комментарии до 17.10.2026 18:00. <сообщение администрации>»"""
    what = 'Ваш аккаунт заблокирован' if block.block_type == 'FULL' else 'Вам запрещено оставлять комментарии'
    reason = f"{what} до {block.date_end.strftime('%d.%m.%Y %H:%M')}."
    message = (block.message or '').strip()
    return f'{reason} {message}' if message else reason


def can_change(user, comment):
    """Править/удалять комментарий: модератор — всегда, автор — первые 5 минут."""
    blocked = full_block_reason(user)
    if blocked:
        return False, blocked
    if is_moderator(user):
        return True, None
    if not user or not user.is_authenticated or comment.author_id != user.pk:
        return False, 'Это чужой комментарий'
    if comment.date + EDIT_WINDOW < now():
        return False, 'Время на изменение комментария истекло'
    return True, None
