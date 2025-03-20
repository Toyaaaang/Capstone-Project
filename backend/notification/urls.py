from django.urls import path
from .views import NotificationListView

urlpatterns = [
    path("list/", NotificationListView.as_view(), name="notification_list"),
]
