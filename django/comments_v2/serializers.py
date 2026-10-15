"""
Комментарий в том же виде, что у старого API (IComment на фронте):
    {id, dt, dt_modified, author, content, images, likes, on_comment?, reply?}
dt — ISO без смещения (по Москве), фронт дописывает +03:00.
"""
from api.postimages.serializers import ImageToJson
from api.user.serializers import UserToJson


def comment_to_json(comment, likes=(), replies=None):
    item = {
        'id': comment.id,
        'dt': comment.date.isoformat(),
        'dt_modified': comment.date_modified.isoformat() if comment.date_modified else None,
        'author': UserToJson(comment.author),
        'content': comment.content or '',
        # images — заранее загруженные (Prefetch to_attr='v2_images') или отдельным запросом
        'images': [ImageToJson(i) for i in (comment.v2_images if hasattr(comment, 'v2_images')
                                            else comment.images.all())],
        'likes': list(likes),
    }
    if comment.on_comment_id:
        item['on_comment'] = comment.on_comment_id
    if replies is not None:
        item['reply'] = replies
    return item


def user_card(user):
    """Карточка для упоминаний — как TAutocompleteUser на фронте."""
    profile = getattr(user, 'profile', None)
    avatar = getattr(profile, 'avatar', None)
    return {
        'id': user.id,
        'username': user.username,
        'name': (getattr(profile, 'nickname', None) or '').strip() or user.username,
        'avatar': avatar.url if avatar else None,
    }
