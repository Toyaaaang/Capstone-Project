from rest_framework import permissions

class IsBudgetAnalyst(permissions.BasePermission):
    """Custom permission to allow only budget analysts to approve/reject requests."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "budget_analyst"
