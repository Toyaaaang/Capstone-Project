from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from rest_framework.permissions import IsAuthenticated
from .models import RequisitionVoucher
from .serializers import CreateRequisitionVoucherSerializer
from warehouse.utils import generate_rv_pdf_preview  # Assuming you have this utility function to generate the PDF
import tempfile
from authentication.models import User
from notification.utils import send_notification 
from warehouse.models import MaterialRestockRequest, RestockItem  


class CreateRequisitionVoucher(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        selected_request_id = request.data.get('request')
        
        if not selected_request_id:
            return Response({"detail": "Missing MaterialRestockRequest ID."}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch the restock request
        try:
            material_restock_request = MaterialRestockRequest.objects.get(id=selected_request_id)
        except MaterialRestockRequest.DoesNotExist:
            return Response({"detail": "MaterialRestockRequest not found."}, status=status.HTTP_404_NOT_FOUND)

        # Get all restock items linked to the request
        restock_items = RestockItem.objects.filter(material_restock_request=material_restock_request)
        if not restock_items.exists():
            return Response({"detail": "No items found for this restock request."}, status=status.HTTP_400_BAD_REQUEST)

        # Serialize items to a list of dictionaries
        serialized_items = [
            {
                "item_name": item.item_name,
                "quantity_requested": item.quantity_requested
            }
            for item in restock_items
        ]

        # Generate and save PDF using tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            generate_rv_pdf_preview(filename=tmp.name, items=serialized_items)
            tmp.seek(0)

            # Create the RequisitionVoucher
            rv = RequisitionVoucher.objects.create(
                request=material_restock_request,
                items=serialized_items,
            )
            # Save the file to the FileField
            rv.pdf_file.save(f"RV-{rv.rv_number}.pdf", tmp)

        # Notify budget analysts
        budget_analysts = User.objects.filter(role="Budget Analyst", is_active=True)
        for analyst in budget_analysts:
            send_notification(
                analyst,
                f"A new restocking request (RV {rv.rv_number}) has been created. Please review the RV document."
            )

        return Response({"detail": "Requisition Voucher created successfully."}, status=status.HTTP_201_CREATED)
 

class RequisitionVoucherPreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        items = request.data.get("items", [])
        if not items:
            return Response({"detail": "No items provided."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate the RV PDF preview
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            generate_rv_pdf_preview(filename=tmp.name, items=items, requested_by=request.user.username)
            tmp.seek(0)
            return FileResponse(open(tmp.name, 'rb'), content_type='application/pdf')


class RequisitionVoucherPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, request_id):
        # Fetch the MaterialRestockRequest by ID
        material_request = get_object_or_404(MaterialRestockRequest, pk=request_id)

        # Fetch the latest associated RequisitionVoucher
        rv = material_request.requisition_vouchers.order_by('-created_at').first()
        if not rv:
            return Response({"detail": "Requisition Voucher not found for this request."}, status=status.HTTP_404_NOT_FOUND)

        # Check if the PDF file exists
        if not rv.pdf_file or not rv.pdf_file.storage.exists(rv.pdf_file.name):
            return Response({"detail": "PDF file not found for this Requisition Voucher."}, status=status.HTTP_404_NOT_FOUND)

        # Return the PDF file as a response
        return FileResponse(rv.pdf_file.open('rb'), content_type='application/pdf')
