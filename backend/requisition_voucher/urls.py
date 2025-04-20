from django.urls import path
from .views import CreateRequisitionVoucher, RequisitionVoucherPreviewView, RequisitionVoucherPDFView

urlpatterns = [
    path('create/', CreateRequisitionVoucher.as_view(), name='create-requisition-voucher'),
    path('preview/', RequisitionVoucherPreviewView.as_view(), name='preview-requisition-voucher'),
    path('view/<int:request_id>/pdf/', RequisitionVoucherPDFView.as_view(), name='requisition-voucher-pdf'),
]