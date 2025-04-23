from django.db import models
from django.utils import timezone
from authentication.models import User
from datetime import date

class   MaterialRestockRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    requested_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="restock_requests"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    # Budget Analyst Approval/Rejection
    approved_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_restock_requests"
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    rejected_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="rejected_restock_requests"
    )
    rejected_at = models.DateTimeField(null=True, blank=True)

    request_reference = models.CharField(max_length=100, unique=True, blank=True)

    po_number = models.CharField(max_length=50, null=True, blank=True)
    rv_number = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"Request #{self.id} - {self.status}"

    def approve(self, user):
        """Mark request as approved and clear rejection fields if necessary."""
        self.status = "approved"
        self.approved_by = user
        self.approved_at = timezone.now()
        self.rejected_by = None  # Ensure rejection is cleared
        self.rejected_at = None
        self.save()

    def reject(self, user):
        """Mark request as rejected and clear approval fields if necessary."""
        self.status = "rejected"
        self.rejected_by = user
        self.rejected_at = timezone.now()
        self.approved_by = None  # Ensure approval is cleared
        self.approved_at = None
        self.save()
        
    def save(self, *args, **kwargs):
        if not self.request_reference:
            year = date.today().year
            count = MaterialRestockRequest.objects.filter(created_at__year=year).count() + 1
            self.request_reference = f"MRR-{year}-{str(count).zfill(4)}"
        super().save(*args, **kwargs)

class RestockItem(models.Model):
    restock_request = models.ForeignKey(
        MaterialRestockRequest, on_delete=models.CASCADE, related_name="items"
    )
    item_name = models.CharField(max_length=255)
    quantity_requested = models.PositiveIntegerField()
    unit = models.CharField(max_length=50, default="pcs")  # kg, liters, meters, etc.

    def __str__(self):
        return f"{self.item_name} - {self.quantity_requested} {self.unit}"
    def to_dict(self):
            return {
                'item_name': self.item_name,
                'quantity_requested': self.quantity_requested,
            }