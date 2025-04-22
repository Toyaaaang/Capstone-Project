from django.contrib.auth.models import AbstractUser
from django.utils.timezone import now
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('warehouse_admin', 'Warehouse Admin'),
        ('warehouse_staff', 'Warehouse Staff'),
        ('manager', 'Manager'),
        ('employee', 'Employee'),
        ('engineering', 'Engineering'),
        ('operations_maintenance', 'Operations Maintenance'),
        ('budget_analyst', 'Budget Analyst'),
    )
    
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='employee')
    is_role_confirmed = models.BooleanField(default=False)
    role_requested_at = models.DateTimeField(default=now)
    signature = models.FileField(upload_to='signatures/', null=True, blank=True)  # Store the PNG file path    
  
    def __str__(self):
        return self.username
