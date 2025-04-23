from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils.timezone import now
from warehouse.models import MaterialRestockRequest
from rest_framework import permissions
from requisition_voucher.models import RequisitionVoucher
from .utils import add_signature_to_rvpdf  # Reuse the utility function
from warehouse.utils import generate_rv_pdf_preview  # Import the utility function
import os
import tempfile
from rest_framework import generics
from .serializers import RestockingRequestSerializer  # Create a serializer for the model
from budget.views import RestockingRequestPagination # Use a custom pagination class if needed

class SignRestockingView(APIView):
    permission_classes = [permissions.IsAuthenticated]  # Ensure only authenticated users can sign

    def post(self, request, pk):
        try:
            print(f"Processing restocking request ID: {pk}")

            # Fetch the restocking request
            restocking_request = MaterialRestockRequest.objects.get(pk=pk)

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

            # Prepare the input PDF path
            input_pdf_path = rv.pdf_file.path

            # Validate input PDF path
            if not os.path.exists(input_pdf_path):
                print(f"Input PDF path does not exist: {input_pdf_path}")
                return Response({"error": "Input PDF not found."}, status=status.HTTP_404_NOT_FOUND)

            # Validate the signature file path
            signature_file_path = request.user.signature.path  # Use .path to get the file path as a string
            if not os.path.exists(signature_file_path):
                return Response({"error": "Signature file not found."}, status=status.HTTP_404_NOT_FOUND)
            print(f"Using signature file at: {signature_file_path}")

            # Call the utility function to add the signature
            try:
                print(f"Calling add_signature_to_pdf with:")
                print(f"  Input PDF: {input_pdf_path}")
                print(f"  Signature File Path: {signature_file_path}")

                add_signature_to_rvpdf(
                    input_pdf=input_pdf_path,
                    signature_path=signature_file_path,  # Pass the file path
                    evaluated_by=request.user.get_full_name()
                )
                print("Signature added to PDF successfully.")
            except Exception as e:
                print(f"Error adding signature to PDF: {e}")
                raise ValueError("Failed to add signature to PDF.")

            return Response({
                "message": "Requisition voucher signed successfully.",
                "rv_number": rv.rv_number,
                "signed_pdf": input_pdf_path
            }, status=status.HTTP_200_OK)

        except MaterialRestockRequest.DoesNotExist:
            return Response({"error": "Restocking request not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Unexpected error: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RestockingRequestsListView(generics.ListAPIView):
    """
    Fetch all restocking requests for the engineering team.
    """
    serializer_class = RestockingRequestSerializer
    permission_classes = [permissions.IsAuthenticated]  
    pagination_class = RestockingRequestPagination  

    def get_queryset(self):
        """
        Return all restocking requests, regardless of status.
        """
        return MaterialRestockRequest.objects.all().order_by("-created_at")
