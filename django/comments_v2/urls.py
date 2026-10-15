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
