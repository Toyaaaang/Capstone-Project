from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_notifications", null=True, blank=True
    )  # System-generated notifications (optional)
    
    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_notifications", null=True, blank=True
    )  # The user receiving the notification
    link = models.URLField(blank=True, null=True)

    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return f"Notification for {self.user.username}" if self.user else "Notification (No User)"
