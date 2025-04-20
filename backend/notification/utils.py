from notification.models import Notification  
from django.utils.timezone import now

def send_notification(user, message):
    """Creates a notification for the specified user."""
    Notification.objects.create(
        recipient=user,
        message=message,
        created_at=now()
    )
