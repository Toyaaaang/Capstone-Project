from django.urls import path
from .views import (
RequisitionVoucherListCreateView,
RequisitionVoucherUpdateView,
PendingRequisitionRequestsView,
RequisitionVoucherPreviewView,
)

urlpatterns = [
    path('restock-requests/', RequisitionVoucherListCreateView.as_view(), name='restock-requests'),
    path('restock-requests/<int:pk>/', RequisitionVoucherUpdateView.as_view(), name='update-restock-request'),
    path('restock-requests/pending/', PendingRequisitionRequestsView.as_view(), name='pending-restock-requests'),
    path("documents/preview/rv/", RequisitionVoucherPreviewView.as_view(), name="preview-rv"),
]
