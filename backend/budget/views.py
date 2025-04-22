from rest_framework import generics, permissions
from warehouse.models import MaterialRestockRequest
from requisition_voucher.models import RequisitionVoucher
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
from budget.utils import add_signature_to_pdf  # Import the utility function
from django.conf import settings
import os
import io
from warehouse.utils import generate_rv_pdf_preview  # Import the utility function
import tempfile
import logging
import base64

logger = logging.getLogger(__name__)

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
    permission_classes = [permissions.IsAuthenticated, IsBudgetAnalyst]

    def post(self, request, pk):
        try:
            print(f"Processing restocking request ID: {pk}")

            # Fetch the restocking request
            restocking_request = MaterialRestockRequest.objects.get(pk=pk)

            # Ensure the request hasn't been processed already
            if restocking_request.status != "pending":
                return Response({"error": "Request is already processed."}, status=status.HTTP_400_BAD_REQUEST)

            # Get the RequisitionVoucher associated with the request
            try:
                rv = RequisitionVoucher.objects.get(request=restocking_request)
            except RequisitionVoucher.DoesNotExist:
                return Response({"error": "Requisition voucher not found."}, status=status.HTTP_404_NOT_FOUND)

            # Check if the PDF file exists
            if not rv.pdf_file or not rv.pdf_file.storage.exists(rv.pdf_file.name):
                print(f"PDF file not found for RV: {rv.rv_number}")
                # Dynamically generate the RV PDF
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    generate_rv_pdf_preview(
                        filename=tmp.name,
                        items=rv.items,
                        requested_by=restocking_request.requested_by.username,
                        rv_number=rv.rv_number
                    )
                    tmp.seek(0)
                    rv.pdf_file.save(f"RV-{rv.rv_number}.pdf", tmp)
                    rv.save()

            # Prepare the input and output PDF paths
            input_pdf_path = rv.pdf_file.path
            output_pdf_path = os.path.join(settings.MEDIA_ROOT, "requisition_vouchers", f"{rv.rv_number}_signed.pdf")

            # Validate input PDF path
            if not os.path.exists(input_pdf_path):
                print(f"Input PDF path does not exist: {input_pdf_path}")
                return Response({"error": "Input PDF not found."}, status=status.HTTP_404_NOT_FOUND)

            # Validate output directory
            output_dir = os.path.dirname(output_pdf_path)
            if not os.path.exists(output_dir):
                print(f"Output directory does not exist: {output_dir}")
                return Response({"error": "Output directory not found."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Validate the signature file path
            signature_file_path = request.user.signature.path  # Use .path to get the file path as a string
            if not os.path.exists(signature_file_path):
                return Response({"error": "Signature file not found."}, status=status.HTTP_404_NOT_FOUND)
            print(f"Using signature file at: {signature_file_path}")

            # Call the utility function to add the signature
            try:
                print(f"Calling add_signature_to_pdf with:")
                print(f"  Input PDF: {input_pdf_path}")
                print(f"  Output PDF Path: {output_pdf_path}")
                print(f"  Signature File Path: {signature_file_path}")

                add_signature_to_pdf(
                    input_pdf=input_pdf_path,
                    output_pdf_path=output_pdf_path,
                    signature_path=signature_file_path,  # Pass the file path
                    evaluated_by=request.user.get_full_name()
                )
                print("Signature added to PDF successfully.")
            except Exception as e:
                print(f"Error adding signature to PDF: {e}")
                raise ValueError("Failed to add signature to PDF.")

            # Update the restocking request status
            restocking_request.status = "approved"
            restocking_request.approved_by = request.user
            restocking_request.approved_at = now()
            restocking_request.save()

            return Response({
                "message": "Restocking request approved successfully.",
                "rv_number": rv.rv_number,
                "signed_pdf": output_pdf_path
            }, status=status.HTTP_200_OK)

        except MaterialRestockRequest.DoesNotExist:
            return Response({"error": "Restocking request not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Unexpected error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
             
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
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


