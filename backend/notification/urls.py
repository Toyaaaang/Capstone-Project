from django.urls import path
from .views import (
    NotificationListView,
    MarkNotificationAsReadView,
    DeleteNotificationView,
    ClearAllNotificationsView
)

urlpatterns = [
    path('list/', NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/mark_as_read/', MarkNotificationAsReadView.as_view(), name='mark-as-read'),
    path('<int:pk>/delete/', DeleteNotificationView.as_view(), name='delete-notification'),
    path('clear/', ClearAllNotificationsView.as_view(), name='clear-all-notifications'),
]
