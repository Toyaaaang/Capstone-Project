from django.urls import path
from .views import (
    PendingRestockingRequestsView,
    ApproveRestockingView,
    RejectRestockingView,
    ProcessedRestockingRequestsView,
    ApprovedRestockingRequestsView)

urlpatterns = [
    path("restocking/pending/", PendingRestockingRequestsView.as_view(), name="pending-restocking"),
    path("restocking/approve/<int:pk>/", ApproveRestockingView.as_view(), name="approve-restocking"),
    path("restocking/reject/<int:pk>/", RejectRestockingView.as_view(), name="reject-restocking"),
    path("restocking/history/", ProcessedRestockingRequestsView.as_view(), name="processed-restocking-requests"),
    path('restocking/approved-with-rv/', ApprovedRestockingRequestsView.as_view(), name='approved-restocking-with-rv'),
]
