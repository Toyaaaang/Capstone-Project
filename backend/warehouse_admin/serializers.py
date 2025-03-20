from rest_framework import serializers
from authentication.models import User

class RoleApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "is_role_confirmed", "role_requested_at"]
        read_only_fields = ["username", "email", "role", "role_requested_at"]

    def update(self, instance, validated_data):
        instance.is_role_confirmed = validated_data.get("is_role_confirmed", instance.is_role_confirmed)
        instance.save()
        return instance
