from rest_framework import generics, permissions
from warehouse.models import MaterialRestockRequest
from .serializers import BudgetRestockingRequestSerializer
from authentication.permissions import IsBudgetAnalyst 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now
from rest_framework.permissions import IsAuthenticated
from warehouse.models import MaterialRestockRequest  # Ensure correct import
from notification.utils import send_notification  # If notifications are used
from datetime import datetime
from rest_framework import generics, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination


# Pagination Class
class RestockingRequestPagination(PageNumberPagination):
    page_size = 7  # Adjust as needed
    page_size_query_param = 'page_size'
    max_page_size = 50
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'results': data,
        })



class PendingRestockingRequestsView(generics.ListAPIView):
    """Fetch all pending restocking requests."""
    
    queryset = MaterialRestockRequest.objects.filter(status="pending").order_by('-created_at').prefetch_related('items')
    serializer_class = BudgetRestockingRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsBudgetAnalyst]
    pagination_class = RestockingRequestPagination
    
    
    


# View to fetch processed restocking requests with filtering & sorting
class ProcessedRestockingRequestsView(generics.ListAPIView):
    """Fetch all approved and rejected restocking requests with filtering, sorting, and pagination."""
    
    serializer_class = BudgetRestockingRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsBudgetAnalyst]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'approved_at', 'rejected_at', 'created_at']  # Add fields for filtering
    ordering_fields = ['approved_at', 'rejected_at', 'created_at']  # Allow sorting by these fields
    pagination_class = RestockingRequestPagination  # Use pagination class

    def get_queryset(self):
        queryset = MaterialRestockRequest.objects.exclude(status="pending")

        # Additional Filtering by date range
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        if start_date and end_date:
            queryset = queryset.filter(created_at__date__range=[start_date, end_date])
        
        # Filtering by status
        status = self.request.query_params.get("status")
        if status in ["approved", "rejected"]:
            queryset = queryset.filter(status=status)

        # ✅ Add ordering to fix pagination warning
        return queryset.order_by('-created_at')


class ApprovedRestockingRequestListView(generics.ListAPIView):
    """
    Returns a list of approved restocking requests only.
    Used for PO draft creation.
    """
    serializer_class = BudgetRestockingRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsBudgetAnalyst]
    pagination_class = RestockingRequestPagination 
    def get_queryset(self):
        return MaterialRestockRequest.objects.filter(status="approved").order_by("-approved_at")


class ApproveRestockingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            restocking_request = MaterialRestockRequest.objects.get(pk=pk)

            # Ensure the request hasn't been processed already
            if restocking_request.status != "pending":
                return Response({"error": "Request is already processed."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the logged-in Budget Analyst
            budget_analyst = request.user
            user_id = budget_analyst.id
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")  # YYYYMMDDHHMMSS
            request_id = restocking_request.id
            
            # Update request status and approval details
            restocking_request.status = "approved"
            restocking_request.approved_by = budget_analyst
            restocking_request.approved_at = now()

            restocking_request.save()
            
            # Send notification to warehouse staff
            send_notification(
                user=restocking_request.requested_by,
                message=f"Your restocking request (ID: {request_id}) has been approved. Please wait for PO creation.",
            )

            return Response({
                "message": "Restocking request approved successfully.",
                "rv_number": restocking_request.rv_number
            }, status=status.HTTP_200_OK)

        except MaterialRestockRequest.DoesNotExist:
            return Response({"error": "Restocking request not found."}, status=status.HTTP_404_NOT_FOUND)  
        
             
class RejectRestockingView(APIView):
    permission_classes = [IsAuthenticated]  # Only authenticated users can reject

    def post(self, request, pk):
        try:
            restocking_request = MaterialRestockRequest.objects.get(pk=pk)

            # Ensure the request hasn't been processed already
            if restocking_request.status != "pending":
                return Response({"error": "Request is already processed."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the logged-in Budget Analyst
            budget_analyst = request.user

            # Update request status and rejection details
            restocking_request.status = "rejected"
            restocking_request.rejected_by = budget_analyst
            restocking_request.rejected_at = now()
            restocking_request.save()

            # Send a notification to the requester
            send_notification(
                user=restocking_request.requested_by,
                message=f"Your restocking request (ID: {restocking_request.id}) has been rejected.",
            )

            return Response({"message": "Restocking request rejected successfully."}, status=status.HTTP_200_OK)

        except MaterialRestockRequest.DoesNotExist:
            return Response({"error": "Restocking request not found."}, status=status.HTTP_404_NOT_FOUND)


