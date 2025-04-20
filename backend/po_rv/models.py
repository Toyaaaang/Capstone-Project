from django.db import models
from django.conf import settings
from warehouse.models import MaterialRestockRequest  # assuming it's still in `budget`

class DraftPurchaseOrder(models.Model):
    restocking_request = models.OneToOneField(MaterialRestockRequest, on_delete=models.CASCADE, related_name="purchase_order")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    po_number = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, choices=[('draft', 'Draft'), ('finalized', 'Finalized')], default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    fillable_fields = models.JSONField(default=dict, blank=True) 

    def __str__(self):
        return self.po_number


class PurchaseOrder(models.Model):
    restocking_request = models.ForeignKey(MaterialRestockRequest, on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    po_number = models.CharField(max_length=100, unique=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    comments = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[('draft', 'Draft'), ('finalized', 'Finalized')], default='draft')

    def __str__(self):
        return self.po_number
