from django.db import models
from django.utils.timezone import now
from warehouse.models import MaterialRestockRequest

class PurchaseOrder(models.Model):
    po_number = models.CharField(max_length=50, unique=True)  # Unique PO number
    supplier = models.CharField(max_length=255, null= True, blank=True)  # Supplier name
    shipping_instructions = models.TextField(blank=True, null=True)  # Optional shipping instructions
    rv_number = models.CharField(max_length=50, unique=True, default="Default RV Number")  # Associated RV number
    restocking_request = models.OneToOneField(
        MaterialRestockRequest, 
        on_delete=models.CASCADE, 
        related_name="purchase_order"
    )  # Link to the restocking request
    address = models.TextField(default="Supplier Address")
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, default=0)  # Total amount for the PO
    pdf_file = models.FileField(upload_to="purchase_orders/", blank=True, null=True)  # Generated PO PDF
    created_at = models.DateTimeField(default=now) 
    updated_at = models.DateTimeField(auto_now=True) 
    
    def __str__(self):
        return f"PO {self.po_number} - {self.supplier}"

    def generate_po_number(self):
        """
        Generate a unique PO number based on the last created PO.
        """
        last_po = PurchaseOrder.objects.all().order_by("created_at").last()
        if last_po:
            last_number = int(last_po.po_number.split("-")[1])
            return f"PO-{last_number + 1:05d}"  # Increment and pad with zeros
        else:
            return "PO-00001"  # Default starting PO number

    def save(self, *args, **kwargs):
        """
        Automatically generate a PO number if it doesn't exist.
        """
        if not self.po_number:
            self.po_number = self.generate_po_number()
        super().save(*args, **kwargs)