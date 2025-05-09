from rest_framework import serializers
from authentication.models import User
from .models import RoleRequestRecord

class RoleApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "role", "is_role_confirmed", "role_requested_at"]
        read_only_fields = ["username", "email", "role", "role_requested_at"]

    def update(self, instance, validated_data):
        instance.is_role_confirmed = validated_data.get("is_role_confirmed", instance.is_role_confirmed)
        instance.save()
        return instance
    
class UserRoleRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'is_role_confirmed']


class RoleRequestRecordSerializer(serializers.ModelSerializer):
    user = UserRoleRequestSerializer(read_only=True)
    processed_by = UserRoleRequestSerializer(read_only=True)

    class Meta:
        model = RoleRequestRecord
        fields = ['user', 'requested_role', 'status', 'processed_by', 'processed_at']


class RejectRoleRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["role"]  # Only include the role field
