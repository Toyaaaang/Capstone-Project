from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404
from authentication.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from notification.models import Notification
from .models import RoleRequestRecord
from .serializers import RoleRequestRecordSerializer, RoleApprovalSerializer
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q



# Only allow warehouse admins to approve/reject requests
class IsWarehouseAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "warehouse_admin"


# List all users who requested a role but are not confirmed
class PendingRoleRequestsView(generics.ListAPIView):
    queryset = User.objects.filter(is_role_confirmed=False).exclude(role="employee").order_by("-role_requested_at")
    serializer_class = RoleApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsWarehouseAdmin]
    
    
class RoleRequestPagination(PageNumberPagination):
    page_size = 10  # Adjust as needed
    page_size_query_param = "page_size"
    max_page_size = 50  
    
    
#Role request histpry
class RoleRequestHistoryView(generics.ListAPIView):
    serializer_class = RoleRequestRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = RoleRequestPagination

    def get_queryset(self):
        queryset = RoleRequestRecord.objects.all().order_by("-processed_at")

        # Filtering by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date and end_date:
            queryset = queryset.filter(processed_at__date__range=[start_date, end_date])

        # Filtering by status
        status = self.request.query_params.get("status")
        if status in ["approved", "rejected"]:
            queryset = queryset.filter(status=status)

        # Filtering by user (processed_by)
        user = self.request.query_params.get("user")
        if user:
            queryset = queryset.filter(Q(user__username__icontains=user) | Q(processed_by__username__icontains=user))

        return queryset   
    


  
# Approve a role request
class ApproveRoleRequestView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = RoleApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsWarehouseAdmin]

    def get_object(self):
        return get_object_or_404(User, id=self.kwargs.get("pk"))  # Use "pk" instead of "user_id"

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            # Force is_role_confirmed to True
            serializer.save(is_role_confirmed=True)
            
            previous_role = user.role  

            # Log approval
            RoleRequestRecord.objects.create(
                user=user,
                requested_role=previous_role,
                status="approved",
                processed_by=request.user
            )

            # Notify user
            Notification.objects.create(
                recipient=user,
                message=f"Your role request for {previous_role} has been approved!"
            )

            return Response({"detail": "User role request approved."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# Reject a role request
class RejectRoleRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsWarehouseAdmin]

    def post(self, request, user_id):  # Change from `patch` to `post`
        try:
            user = User.objects.get(id=user_id)
            previous_role = user.role or "N/A"  # Ensure there's a value

            # Set role to 'employee' and mark as unconfirmed
            user.role = "employee"
            user.is_role_confirmed = False
            user.save()

            # Record the rejection in the database
            RoleRequestRecord.objects.create(
                user=user,
                requested_role=previous_role,
                status="rejected",
                processed_by=request.user
            )

            # Create a notification for rejection
            Notification.objects.create(
                recipient=user,
                message=f"Your role request for {previous_role} has been rejected. You have been assigned as an Employee."
            )

            return Response({"detail": "User role request rejected."}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
