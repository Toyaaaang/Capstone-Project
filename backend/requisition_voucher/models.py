from django.db import models
from django.utils import timezone
from warehouse.models import MaterialRestockRequest 

class RequisitionVoucher(models.Model):
    rv_number = models.CharField(max_length=20, unique=True)  
    request = models.ForeignKey(MaterialRestockRequest, on_delete=models.CASCADE, related_name="requisition_vouchers")
    created_at = models.DateTimeField(default=timezone.now)
    items = models.JSONField() 
    pdf_file = models.FileField(upload_to='requisition_vouchers/', null=True, blank=True) 
    
    def __str__(self):
        return f"RV-{self.rv_number} for Request {self.request.id}"
    
    def generate_rv_number(self):

        last_rv = RequisitionVoucher.objects.all().order_by('created_at').last()
        if last_rv:
            last_number = int(last_rv.rv_number.split("-")[1])
            return f"RV-{last_number + 1}"
        else:
            return "RV-1001"  

    def save(self, *args, **kwargs):
        if not self.rv_number:
            self.rv_number = self.generate_rv_number()
        super().save(*args, **kwargs)
