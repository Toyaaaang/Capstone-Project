from rest_framework import generics, permissions, serializers
from rest_framework.response import Response
from rest_framework import status
from .models import MaterialRestockRequest, RestockItem
from .serializers import RequisitionVoucherRequestSerializer
from authentication.models import User
from notification.models import Notification  
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse
import tempfile
from tempfile import NamedTemporaryFile
from requisition_voucher.models import RequisitionVoucher 
from .utils import generate_rv_pdf_preview  

class RequisitionVoucherListCreateView(generics.ListCreateAPIView):
    """
    Handles listing all Requisition requests and creating new ones
    along with their corresponding Requisition Voucher (RV).
    """
    serializer_class = RequisitionVoucherRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MaterialRestockRequest.objects.filter(requested_by=self.request.user).prefetch_related("items")

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)



class RequisitionVoucherUpdateView(generics.UpdateAPIView):
    """
    Allows updating restock request status (for approval/rejection).
    """
    serializer_class = RequisitionVoucherRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "budget_analyst":
            return MaterialRestockRequest.objects.filter(status="pending").prefetch_related("items")
        return MaterialRestockRequest.objects.none()

    def perform_update(self, serializer):
        instance = serializer.save()

        # Update RV status if applicable
        if instance.status == "approved":
            instance.approved_by = self.request.user
            instance.approved_at = timezone.now()
        elif instance.status == "rejected":
            instance.rejected_by = self.request.user
            instance.rejected_at = timezone.now()

        instance.save()

        # Notify the warehouse staff/admin who requested it
        Notification.objects.create(
            recipient=instance.requested_by,
            message=f"Your restock request has been {instance.status}.",
            link=f"/warehouse/restock-requests/{instance.id}"
        )

        
class RequisitionVoucherPreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        items = request.data.get("items", [])

        if not items:
            return Response({"detail": "No items provided."}, status=400)

        # Generate the PDF
        temp_file = NamedTemporaryFile(delete=False, suffix=".pdf")
        generate_rv_pdf_preview(temp_file.name, items)

        return FileResponse(open(temp_file.name, "rb"), content_type="application/pdf")


class PendingRequisitionRequestsView(generics.ListAPIView):
    """
    Lists only pending restock requests for budget analysts.
    """
    serializer_class = RequisitionVoucherRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == "budget_analyst":
            return MaterialRestockRequest.objects.filter(status="pending").prefetch_related("items")
        return MaterialRestockRequest.objects.none()

class RestockRequestPreviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        items = request.data.get("items", [])
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            generate_rv_pdf_preview(filename=tmp.name, items=items)
            tmp.seek(0)
            return FileResponse(open(tmp.name, 'rb'), content_type='application/pdf')

