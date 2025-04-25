from django.urls import path
from .views import CreatePurchaseOrderView, PurchaseOrderPreviewView, PurchaseOrderPDFView

urlpatterns = [
    path('create/', CreatePurchaseOrderView.as_view(), name='create-purchase-order'),
    path('preview/', PurchaseOrderPreviewView.as_view(), name='preview-purchase-order'),
    path('<int:request_id>/pdf/', PurchaseOrderPDFView.as_view(), name='purchase-order-pdf'),
]