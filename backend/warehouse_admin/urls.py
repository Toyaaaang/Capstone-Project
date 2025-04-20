from django.urls import path
from .views import PendingRoleRequestsView, ApproveRoleRequestView, RejectRoleRequestView, RoleRequestHistoryView

urlpatterns = [
    path("pending-requests/", PendingRoleRequestsView.as_view(), name="pending-requests"),
     path("role-requests/history/", RoleRequestHistoryView.as_view(), name="role-request-history"),
    path("approve-request/<int:pk>/", ApproveRoleRequestView.as_view(), name="approve-request"),
    path("reject-request/<int:user_id>/", RejectRoleRequestView.as_view(), name="reject-role-request"),
]
