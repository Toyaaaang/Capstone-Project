from rest_framework import serializers
from warehouse.models import MaterialRestockRequest

class RestockingRequestSerializer(serializers.ModelSerializer):
    requested_by = serializers.CharField(source="requested_by.username", read_only=True)

    class Meta:
        model = MaterialRestockRequest
        fields = [
            "id",
            "requested_by",
            "status",
            "created_at",
            "approved_at",
            "rejected_at",
        ]