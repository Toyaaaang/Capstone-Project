from django.urls import path
from .views import PendingRoleRequestsView, ApproveRoleRequestView

urlpatterns = [
    path("pending-requests/", PendingRoleRequestsView.as_view(), name="pending-requests"),
    path("approve-request/<int:pk>/", ApproveRoleRequestView.as_view(), name="approve-request"),
]
