# Комментарии v2 — только сессия: кука + CSRF, без JWT и без токенов в шаблоне.
# Старые ручки api/comments, api/like, api/postimages, api/autocomplete НЕ трогаем — фронт
# переедет на v2, старое можно будет удалить позже.
#
# Те же файлы по отдельности — в comments/django/comments_v2/ (можно копировать как есть).
#
# ── Ручки (все под /api/v1/v2comments/) ────────────────────────────────────
#
#   GET    <type>/<id>/                  список (аноним тоже)
#            ?before=<id>        более ранние ветки (id первого загруженного верхнего комментария)
#            ?comment_id=<id>    якорь: от ветки этого комментария до самых новых
#            ?limit=<n>          до 100, по умолчанию 10
#          → {"comments": [...старые → новые, у каждого reply: [...]], "after_exist": bool}
#          403 {"detail": "Комментарии к этой публикации закрыты" | "Публикация недоступна"}
#   POST   <type>/<id>/                  новый комментарий / ответ
#          JSON {content, reply_to?, images?: [id своих картинок]}
#          или multipart: content, reply_to?, images (файлы), image_ids (id своих картинок)
#          → 201 {"comment": {...}}
#   GET    <type>/<id>/perms/            права вошедшего (аноним — 403)
#          → {"can_send", "send_reason", "is_moderator", "edit_window": 300, "max_images": 10}
#   POST   <type>/<id>/bulk-delete/      {"comment_ids": [...]} — модератор → {"deleted": n}
#   PATCH  comment/<id>/                 JSON {content, images: [id, которые остаются]}
#                                        или multipart: content, keep_images, images (новые файлы)
#   DELETE comment/<id>/                 → 204
#   PUT    comment/<id>/like/            поставить лайк (повтор ничего не меняет)
#   DELETE comment/<id>/like/            снять лайк       → оба {"liked", "likes": [user_id...]}
#   GET    images/?limit=21&last_id=     мои картинки → {"images": [...], "more"}
#   POST   images/                       загрузить (multipart) → {"files": [[поле, image]], "errors"}
#   GET    users/?q=&offset=&limit=      для @упоминаний → {"objects": [{id,username,name,avatar}], "more"}
#
#   <type> — post или postimages (остальные модели — 404). Ошибки — {"detail": "текст по-русски"}.
#   Формат комментария — как IComment на фронте (id, dt, dt_modified, author, content, images,
#   likes, on_comment?, reply?), то есть как у старого API.
#
# ── Правила (rights.py) ─────────────────────────────────────────────────────
#   читать: публикация published/profile, дата наступила, комментарии открыты (post.commented);
#   писать: + вошёл, активен, есть псевдоним, нет блокировки FULL/COMMENTS (причина — с датой
#           окончания и сообщением администрации из UserBlock), не в ЧС автора поста;
#   править/удалять своё: первые 5 минут (и писать по-прежнему можно); модератор — всегда;
#   полная блокировка (FULL) — 403 на любое действие: лайк, правка, удаление, загрузка картинок.
#     UserBlockMiddleware тут не помогает: он ловит старые вьюхи по имени функции (comment_api,
#     like_api…), а у APIView имя другое — поэтому v2 проверяет блокировку сама;
#   модератор — user.is_staff (одна функция is_moderator — поменять в одном месте);
#   ответ на ответ уходит в ветку верхнего; reply_to — только из этой же записи;
#   картинок на комментарий — до 10 (MAX_COMMENT_IMAGES), файлы проверяются на «правда картинка».
#
# ── Что исправлено относительно старого API ─────────────────────────────────
#   • список проверяет пост (черновики и закрытые комментарии больше не отдаются);
#   • права — одна функция и для формы, и для отправки (раньше POST не проверял псевдоним);
#   • ответы в списке — только опубликованные и не забаненные (раньше — любые);
#   • комментировать можно только post/postimages, а не любую модель blog;
#   • лайк — PUT/DELETE вместо переключателя: двойной клик не снимает лайк; site у лайка —
#     как у комментария (SessionLikeAPI ставил AL всегда, и на AltCG лайки не было видно);
#   • массовое удаление — по одному объекту, чтобы на каждый ушёл remove_comment в сокет;
#   • упоминания — по псевдониму И логину, с рабочей пагинацией, без скрытых.
#
# ── Подключение ─────────────────────────────────────────────────────────────
#   1) создать пакет api/comments_v2/ с файлами ниже (__init__.py — пустой);
#   2) в api/urls.py (from django.urls import include уже есть):
#          path('v2comments/', include('api.comments_v2.urls')),
#      Отдельный префикс, а не comments/v2/: иначе /comments/v2/images/ ловил старый шаблон
#      comments/<content_type>/<object_id>/ (content_type='v2', object_id='images').
#   3) в INSTALLED_APPS не добавлять (моделей нет);
#   4) CommentsConsumer — п. 6 (закрыть рассылку событий от клиента);
#   5) blocking/models.py — п. 7 (срок блокировки по умолчанию считался от запуска сервера).


# ── 1. api/comments_v2/__init__.py — пустой файл ────────────────────────────


# ── 2. api/comments_v2/rights.py ────────────────────────────────────────────
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


# ── 3. api/comments_v2/serializers.py ───────────────────────────────────────
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


# ── 4. api/comments_v2/views.py ─────────────────────────────────────────────
"""
Комментарии v2 — только сессия (кука + CSRF), без JWT и токенов в шаблоне.
Старые ручки api/comments не тронуты.

Права — rights.py. Формат комментария — serializers.comment_to_json (как IComment на фронте).
События в сокет comments_<type>_<id> по-прежнему шлют сигналы blog/signals.py.
"""
import logging
import re
import threading
from collections import defaultdict

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Case, IntegerField, Prefetch, Q, Value, When
from django.template.defaultfilters import truncatechars
from django.utils import timezone as tz
from django.utils.html import strip_tags
from rest_framework import parsers
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.comments.utils import CheckContentlength, CleanCommentContent
from api.comments.views import validate_comment_image
from api.postimages.serializers import ImageToJson
from blog.models import Comment, Like, Notification, PostImages

from api.comments_v2.rights import (
    EDIT_WINDOW, MAX_COMMENT_IMAGES, can_change, full_block_reason, get_target, is_moderator, read_rights,
    send_rights,
)
from api.comments_v2.serializers import comment_to_json, user_card

logger = logging.getLogger('alterlit')

PAGE_SIZE = 10
MAX_PAGE = 100
AROUND_MAX = 500  # якорь ?comment_id: сколько веток максимум отдаём одной пачкой


def site_by_mode(request):
    return {'alterlit': 'AL', 'altcg': 'ALT'}.get(getattr(request, 'mode', None), 'AL')


def _int(value, default=None):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _not_found():
    return Response({'detail': 'Не найдено'}, status=404)


def _blocked(request):
    """403 при полной блокировке. UserBlockMiddleware ловит только старые вьюхи по имени
    (comment_api, like_api…) — до APIView он не доходит, поэтому проверяем сами."""
    reason = full_block_reason(request.user)
    return Response({'detail': reason}, status=403) if reason else None


# ── выборка ─────────────────────────────────────────────────────────────────
def _base_qs(ct, object_id, site):
    """Видимые комментарии записи: опубликованы, не забанены, с этого сайта."""
    return (Comment.objects
            .filter(content_type=ct, object_id=object_id, site=site, status='published', is_banned=False)
            .select_related('author', 'author__profile')
            .prefetch_related(Prefetch('author__groups', to_attr='v2_groups'),
                              Prefetch('images', to_attr='v2_images')))


def _likes_by_comment(ids, site):
    likes = defaultdict(list)
    if ids:
        for row in (Like.objects
                    .filter(site=site, like=True, content_type__model='comment', object_id__in=ids)
                    .values('object_id', 'user_id')):
            likes[row['object_id']].append(row['user_id'])
    return likes


def _threads_to_json(threads, ct, object_id, site):
    """Верхние комментарии (старые → новые) с ответами и лайками одной пачкой запросов."""
    ids = [c.id for c in threads]
    replies = defaultdict(list)
    for r in _base_qs(ct, object_id, site).filter(on_comment_id__in=ids).order_by('id'):
        replies[r.on_comment_id].append(r)
    likes = _likes_by_comment(ids + [r.id for rs in replies.values() for r in rs], site)
    return [
        comment_to_json(c, likes[c.id], [comment_to_json(r, likes[r.id]) for r in replies[c.id]])
        for c in threads
    ]


# ── список и создание ───────────────────────────────────────────────────────
class CommentsView(APIView):
    """
    GET  /api/v1/v2comments/<type>/<id>/                — последние PAGE_SIZE веток
         ?before=<id>        — более ранние ветки (id первого загруженного)
         ?comment_id=<id>    — для якоря: от ветки этого комментария до самых новых
         ?limit=<n>          — размер страницы, до 100
         → {"comments": [...старые → новые], "after_exist": bool}
         403 {"detail"} — публикация недоступна или комментарии закрыты; 404 — нет записи
    POST /api/v1/v2comments/<type>/<id>/                — новый комментарий или ответ
         JSON {content, reply_to?, images?: [id своих картинок]}
         или multipart: content, reply_to?, images (файлы), image_ids (id своих картинок)
         → 201 {"comment": {...}}; 400/403 {"detail"}
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [AllowAny]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def get(self, request, content_type, object_id):
        target = get_target(content_type, object_id)
        if target is None:
            return _not_found()
        ok, reason = read_rights(target)
        if not ok:
            return Response({'detail': reason}, status=403)

        ct = ContentType.objects.get_for_model(target)
        site = site_by_mode(request)
        top = _base_qs(ct, target.pk, site).filter(on_comment__isnull=True)

        anchor = _int(request.query_params.get('comment_id'))
        if anchor:
            # ветка комментария из ссылки и все новее — чтобы до него можно было доскроллить
            thread_id = (Comment.objects.filter(pk=anchor, content_type=ct, object_id=target.pk)
                         .values_list('on_comment_id', 'id').first())
            if thread_id:
                top = top.filter(id__gte=thread_id[0] or thread_id[1])
                page = list(top.order_by('id')[:AROUND_MAX])
                after_exist = _base_qs(ct, target.pk, site).filter(
                    on_comment__isnull=True, id__lt=page[0].id).exists() if page else False
                return Response({'comments': _threads_to_json(page, ct, target.pk, site),
                                 'after_exist': after_exist})

        limit = min(max(_int(request.query_params.get('limit'), PAGE_SIZE), 1), MAX_PAGE)
        before = _int(request.query_params.get('before'))
        if before:
            top = top.filter(id__lt=before)
        page = list(top.order_by('-id')[:limit + 1])
        after_exist = len(page) > limit
        page = list(reversed(page[:limit]))
        return Response({'comments': _threads_to_json(page, ct, target.pk, site), 'after_exist': after_exist})

    def post(self, request, content_type, object_id):
        target = get_target(content_type, object_id)
        if target is None:
            return _not_found()
        ok, reason = send_rights(request.user, target)
        if not ok:
            return Response({'detail': reason}, status=403)

        ct = ContentType.objects.get_for_model(target)
        site = site_by_mode(request)
        data = request.data
        try:
            content, files, image_ids = _read_body(request)
            parent = None
            reply_to = _int(data.get('reply_to'))
            if reply_to:
                parent = (Comment.objects
                          .filter(pk=reply_to, content_type=ct, object_id=target.pk,
                                  status='published', is_banned=False)
                          .first())
                if parent is None:
                    raise ValueError('Комментарий, на который вы отвечаете, не найден')
                if parent.on_comment_id:  # ответ на ответ — в ветку верхнего
                    parent = parent.on_comment

            own_images = list(PostImages.objects.filter(id__in=image_ids, user=request.user))
            if not content and not files and not own_images:
                raise ValueError('Напишите текст или прикрепите картинку')
            if len(files) + len(own_images) > MAX_COMMENT_IMAGES:
                raise ValueError(f'Можно прикрепить не больше {MAX_COMMENT_IMAGES} картинок')

            with transaction.atomic():
                comment = Comment.objects.create(
                    author=request.user, status='published', content_type=ct, object_id=target.pk,
                    site=site, allow_edit_dt=tz.now() + EDIT_WINDOW,
                    on_comment=parent, content=content or None,
                )
                images = own_images + [PostImages.objects.create(user=request.user, image=f) for f in files]
                if images:
                    comment.images.set(images)
        except ValueError as ex:
            return Response({'detail': str(ex)}, status=400)

        if content:
            url = f'/{content_type}/{target.pk}/?anchor=comments&comment_id={comment.id}'
            transaction.on_commit(lambda: _notify_mentions(content, request.user, url, site))

        comment.v2_images = images
        return Response({'comment': comment_to_json(comment, [], None if parent else [])}, status=201)


def _read_body(request):
    """content (очищенный), новые файлы, id уже загруженных своих картинок."""
    data = request.data
    is_multipart = (request.content_type or '').startswith('multipart/')
    content = (data.get('content') or '').strip()
    if is_multipart:
        files = request.FILES.getlist('images')
        raw_ids = data.getlist('image_ids')
    else:
        files = []
        raw_ids = data.get('images') or []
        if not isinstance(raw_ids, list):
            raise ValueError('images — список id картинок')
    image_ids = [i for i in (_int(x) for x in raw_ids) if i]
    for f in files:
        validate_comment_image(f)  # размер, что это правда картинка, формат
    if content:
        content = CleanCommentContent(content)
        CheckContentlength(content)
    return content, files, image_ids


RE_PROFILE = re.compile(r'/profile/([\w.@+-]+)/')


def _notify_mentions(content, author, url, site):
    """Уведомления тем, на кого ссылаются в комментарии (@упоминания). В фоне — не держим ответ."""
    def run():
        try:
            usernames = set(RE_PROFILE.findall(content)) - {author.username}
            if not usernames:
                return
            excerpt = truncatechars(strip_tags(content).strip().replace('&nbsp;', ' '), 150)
            text = (f'<b><a href="{author.get_url()}">{author.get_name()}</a></b> упомянул(а) вас в своём '
                    f'<a href="{url}">комментарии</a>:<br/><a href="{url}">{excerpt}</a>')
            for user in User.objects.filter(username__in=usernames, is_active=True):
                Notification.send_notif(user, text, 'CU', site)
        except Exception:
            logger.exception('comments_v2: mention notifications')
    threading.Thread(target=run, daemon=True).start()


# ── права для формы ─────────────────────────────────────────────────────────
class CommentsPermsView(APIView):
    """
    GET /api/v1/v2comments/<type>/<id>/perms/   (только вошедшим; аноним — 403)
        → {"can_send": bool, "send_reason": str | null, "is_moderator": bool, "edit_window": 300,
           "max_images": 10}
    Читать или нет — решает сам список (403 с причиной), поэтому здесь только право писать.
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, content_type, object_id):
        target = get_target(content_type, object_id)
        if target is None:
            return _not_found()
        ok, reason = send_rights(request.user, target)
        return Response({
            'can_send': ok,
            'send_reason': reason,
            'is_moderator': is_moderator(request.user),
            'edit_window': int(EDIT_WINDOW.total_seconds()),
            'max_images': MAX_COMMENT_IMAGES,
        })


# ── один комментарий: правка и удаление ─────────────────────────────────────
class CommentDetailView(APIView):
    """
    PATCH  /api/v1/v2comments/comment/<id>/
           JSON {content, images: [id картинок, которые остаются]}
           или multipart: content, keep_images (id, которые остаются), images (новые файлы)
           → {"comment": {...}}
    DELETE /api/v1/v2comments/comment/<id>/  → 204
    Автор — первые 5 минут, модератор — всегда.
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def _get(self, comment_id):
        return Comment.objects.select_related('author', 'author__profile').filter(pk=comment_id).first()

    def patch(self, request, comment_id):
        comment = self._get(comment_id)
        if comment is None:
            return _not_found()
        ok, reason = can_change(request.user, comment)
        if ok and not is_moderator(request.user):
            target = get_target(comment.content_type.model, comment.object_id)
            ok, reason = send_rights(request.user, target) if target else (False, 'Запись недоступна')
        if not ok:
            return Response({'detail': reason}, status=403)

        try:
            data = request.data
            is_multipart = (request.content_type or '').startswith('multipart/')
            content, files, _ = _read_body(request)
            current = set(comment.images.values_list('id', flat=True))
            raw_keep = data.getlist('keep_images') if is_multipart else (data.get('images') or [])
            # оставить можно только то, что уже было у ЭТОГО комментария, или свои картинки автора
            wanted = {i for i in (_int(x) for x in raw_keep) if i}
            keep = (wanted & current) | set(PostImages.objects.filter(
                id__in=wanted - current, user_id=comment.author_id).values_list('id', flat=True))
            if not content and not keep and not files:
                raise ValueError('Напишите текст или оставьте картинку')
            if len(keep) + len(files) > MAX_COMMENT_IMAGES:
                raise ValueError(f'Можно прикрепить не больше {MAX_COMMENT_IMAGES} картинок')

            with transaction.atomic():
                comment.content = content or None
                comment.date_modified = tz.now()
                comment.save(update_fields=['content', 'date_modified'])
                # новые файлы — от имени автора комментария, даже если правит модератор
                added = [PostImages.objects.create(user_id=comment.author_id, image=f) for f in files]
                comment.images.set([*keep, *(img.id for img in added)])
        except ValueError as ex:
            return Response({'detail': str(ex)}, status=400)

        site = comment.site
        likes = _likes_by_comment([comment.id], site)[comment.id]
        comment = _base_qs(comment.content_type, comment.object_id, site).filter(pk=comment.pk).first() or comment
        return Response({'comment': comment_to_json(comment, likes)})

    def delete(self, request, comment_id):
        comment = self._get(comment_id)
        if comment is None:
            return _not_found()
        ok, reason = can_change(request.user, comment)
        if not ok:
            return Response({'detail': reason}, status=403)
        comment.delete()  # ответы — каскадом; сигнал разошлёт remove_comment
        return Response(status=204)


# ── массовое удаление (модератор) ───────────────────────────────────────────
class CommentsBulkDeleteView(APIView):
    """POST /api/v1/v2comments/<type>/<id>/bulk-delete/  {"comment_ids": [...]} → {"deleted": n}"""
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, content_type, object_id):
        if not is_moderator(request.user):
            return Response({'detail': 'Недостаточно прав'}, status=403)
        if (blocked := _blocked(request)):
            return blocked
        target = get_target(content_type, object_id)
        if target is None:
            return _not_found()
        ids = [i for i in (_int(x) for x in (request.data.get('comment_ids') or [])) if i][:500]
        if not ids:
            return Response({'detail': 'Не выбраны комментарии'}, status=400)
        ct = ContentType.objects.get_for_model(target)
        # по одному, а не queryset.delete(): тогда на каждый придёт сигнал remove_comment
        deleted = 0
        for comment in Comment.objects.filter(pk__in=ids, content_type=ct, object_id=target.pk):
            comment.delete()
            deleted += 1
        return Response({'deleted': deleted})


# ── лайки ───────────────────────────────────────────────────────────────────
class CommentLikeView(APIView):
    """
    PUT    /api/v1/v2comments/comment/<id>/like/  — поставить (повтор — без изменений)
    DELETE /api/v1/v2comments/comment/<id>/like/  — снять
    → {"liked": bool, "likes": [user_id, ...]}
    События like_comment / dislike_comment шлют сигналы Like.
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def _comment(self, comment_id):
        return Comment.objects.filter(pk=comment_id, status='published', is_banned=False).first()

    def _response(self, comment, liked):
        return Response({'liked': liked, 'likes': _likes_by_comment([comment.id], comment.site)[comment.id]})

    def put(self, request, comment_id):
        if (blocked := _blocked(request)):
            return blocked
        comment = self._comment(comment_id)
        if comment is None:
            return _not_found()
        ct = ContentType.objects.get_for_model(Comment)
        exists = Like.objects.filter(user=request.user, content_type=ct, object_id=comment.id, like=True).exists()
        if not exists:
            # site — как у комментария: список считает лайки своего сайта
            Like.objects.create(user=request.user, like=True, content_type=ct, object_id=comment.id, site=comment.site)
        return self._response(comment, True)

    def delete(self, request, comment_id):
        if (blocked := _blocked(request)):
            return blocked
        comment = self._comment(comment_id)
        if comment is None:
            return _not_found()
        # по одному — чтобы на каждый ушёл сигнал dislike_comment
        for like in Like.objects.filter(user=request.user, content_type__model='comment',
                                        object_id=comment.id, like=True):
            like.delete()
        return self._response(comment, False)


# ── свои картинки для вложений ──────────────────────────────────────────────
class MyImagesView(APIView):
    """
    GET  /api/v1/v2comments/images/?limit=21&last_id=<id>  — мои картинки, новые сверху
         → {"images": [{id, url, preview}], "more": bool}
    POST /api/v1/v2comments/images/  multipart, любые имена полей с файлами
         → {"files": [[имя_поля, {id, url, preview}]], "errors": [[имя_поля, текст]]}
         (формат как у старого POST images/ — окно вложений его понимает)
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def get(self, request):
        limit = min(max(_int(request.query_params.get('limit'), 21), 1), 60)
        qs = PostImages.objects.filter(user=request.user).order_by('-id')
        last_id = _int(request.query_params.get('last_id'))
        if last_id:
            qs = qs.filter(id__lt=last_id)
        page = list(qs[:limit + 1])
        return Response({'images': [ImageToJson(i) for i in page[:limit]], 'more': len(page) > limit})

    def post(self, request):
        if (blocked := _blocked(request)):
            return blocked
        if not request.FILES:
            return Response({'detail': 'Нет файлов'}, status=400)
        files, errors = [], []
        for name in request.FILES:
            f = request.FILES[name]
            key = name.replace('attach-', '')
            try:
                validate_comment_image(f)
                files.append([key, ImageToJson(PostImages.objects.create(image=f, user=request.user))])
            except ValueError as ex:
                errors.append([key, str(ex)])
        if not files:
            return Response({'detail': 'Не удалось загрузить', 'errors': errors}, status=400)
        return Response({'files': files, 'errors': errors})


# ── упоминания ──────────────────────────────────────────────────────────────
class MentionUsersView(APIView):
    """
    GET /api/v1/v2comments/users/?q=<строка>&offset=0&limit=20
        → {"objects": [{id, username, name, avatar}], "more": bool}
    По псевдониму и логину; точное совпадение → начинается с → содержит. Без неактивных и скрытых.
    """
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        q = (request.query_params.get('q') or '').strip()[:50]
        offset = min(max(_int(request.query_params.get('offset'), 0), 0), 500)
        limit = min(max(_int(request.query_params.get('limit'), 20), 1), 50)
        if not q:
            return Response({'objects': [], 'more': False})

        either = lambda lookup: Q(**{f'username__{lookup}': q}) | Q(**{f'profile__nickname__{lookup}': q})  # noqa: E731
        users = (User.objects
                 .filter(is_active=True)
                 .filter(either('icontains'))
                 .exclude(profile__global_hidden=True)
                 .select_related('profile')
                 .only('id', 'username', 'profile__nickname', 'profile__avatar')
                 .annotate(rank=Case(When(either('iexact'), then=Value(0)),
                                     When(either('istartswith'), then=Value(1)),
                                     default=Value(2), output_field=IntegerField()))
                 .order_by('rank', 'profile__nickname', 'username', 'id'))
        page = list(users[offset:offset + limit + 1])
        return Response({'objects': [user_card(u) for u in page[:limit]], 'more': len(page) > limit})


# ── 5. api/comments_v2/urls.py ──────────────────────────────────────────────
from django.urls import path

from api.comments_v2 import views

# подключается в api/urls.py: path('v2comments/', include('api.comments_v2.urls'))
urlpatterns = [
    path('comment/<int:comment_id>/', views.CommentDetailView.as_view(), name='comments_v2_comment'),
    path('comment/<int:comment_id>/like/', views.CommentLikeView.as_view(), name='comments_v2_like'),
    path('images/', views.MyImagesView.as_view(), name='comments_v2_images'),
    path('users/', views.MentionUsersView.as_view(), name='comments_v2_users'),
    path('<str:content_type>/<int:object_id>/', views.CommentsView.as_view(), name='comments_v2_list'),
    path('<str:content_type>/<int:object_id>/perms/', views.CommentsPermsView.as_view(), name='comments_v2_perms'),
    path('<str:content_type>/<int:object_id>/bulk-delete/', views.CommentsBulkDeleteView.as_view(),
         name='comments_v2_bulk_delete'),
]


# ── 6. blog/consumers.py — CommentsConsumer ─────────────────────────────────
# Сейчас он пересылает всем зрителям страницы ЛЮБОЕ событие клиента, даже анонимного:
# можно разослать поддельный new_comment от чужого имени. События шлют только сигналы —
# от клиента принимаем один ping (фронт шлёт его раз в минуту) и отвечаем на него.
#
# class CommentsConsumer(AsyncWebsocketConsumer):
#     # connect, disconnect, chat_message — без изменений
#
#     async def receive(self, text_data):
#         try:
#             message = json.loads(text_data).get('message') or {}
#         except (ValueError, AttributeError):
#             return
#         if isinstance(message, dict) and message.get('type') == 'ping':
#             await self.send(text_data=json.dumps({'message': {'type': 'ping'}}))


# ── 7. blocking/models.py — срок блокировки по умолчанию ────────────────────
# Сейчас: date_end = DateTimeField(..., default=(tz.now() + td(days=3)))
# Выражение вычисляется ОДИН раз — при импорте модели, то есть при запуске Django. Блокировка,
# созданная без явной даты (в админке поле предзаполнится тем же значением), получит срок
# «3 дня от последнего рестарта сервера», а не от момента блокировки. Через несколько дней
# аптайма такая блокировка создаётся уже истёкшей.
#
# Нужна функция (callable) — Django вызывает её при создании каждой записи:
#
#     def default_block_end():
#         return tz.now() + td(days=3)
#
#
#     class UserBlock(models.Model):
#         ...
#         date_end = models.DateTimeField(verbose_name="Дата и время окончания блокировки",
#                                         default=default_block_end)
#
# Функция — на уровне модуля (не lambda): миграции сохраняют ссылку на неё по имени.
# ./manage.py makemigrations blocking создаст AlterField — в таблице ничего не меняется
# (default в Django, не в БД), migrate проходит мгновенно.
