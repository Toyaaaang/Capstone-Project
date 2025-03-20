from rest_framework import generics, permissions
from authentication.models import User
from .serializers import RoleApprovalSerializer

# Only allow warehouse admins to approve/reject requests
class IsWarehouseAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "warehouse_admin"

# List all users who requested a role but are not confirmed
class PendingRoleRequestsView(generics.ListAPIView):
    queryset = User.objects.filter(is_role_confirmed=False).order_by("-role_requested_at")
    serializer_class = RoleApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsWarehouseAdmin]

# Approve or reject a role request
class ApproveRoleRequestView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = RoleApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsWarehouseAdmin]
