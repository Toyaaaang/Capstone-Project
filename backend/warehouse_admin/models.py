from django.db import models
from authentication.models import User

class RoleRequestRecord(models.Model):
    STATUS_CHOICES = [
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    requested_role = models.CharField(max_length=50)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="processed_requests")
    processed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.status} - {self.requested_role}"
