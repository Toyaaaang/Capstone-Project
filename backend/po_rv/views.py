from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.http import FileResponse
from django.core.exceptions import SuspiciousFileOperation
from .models import PurchaseOrder
from warehouse.models import MaterialRestockRequest
from authentication.models import User
from notification.utils import send_notification
from .utils import generate_po_pdf_preview  
from .serializers import PurchaseOrderSerializer
import tempfile


class CreatePurchaseOrderView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PurchaseOrderSerializer(data=request.data)
        if serializer.is_valid():
            po = serializer.save()
            return Response({
                "detail": "Purchase Order created successfully.",
                "po_number": po.po_number,
                "pdf_file": po.pdf_file.url,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PurchaseOrderPreviewView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        items = request.data.get("items", [])
        supplier = request.data.get("supplier")
        grand_total = request.data.get("grand_total")

        if not items or not supplier or not grand_total:
            return Response({"detail": "Missing required fields (items, supplier, or grand_total)."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate items
        for item in items:
            if not all(key in item for key in ["unit", "description", "quantity", "unit_price", "total_price"]):
                return Response({"error": "Invalid item structure. Each item must include 'unit', 'description', 'quantity', 'unit_price', and 'total_price'."}, status=status.HTTP_400_BAD_REQUEST)

        # Generate the PO PDF preview
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                generate_po_pdf_preview(filename=tmp.name, items=items, supplier=supplier, grand_total=grand_total)
                tmp.seek(0)
                return FileResponse(open(tmp.name, 'rb'), content_type='application/pdf')
        except Exception as e:
            return Response({"detail": f"Unexpected error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PurchaseOrderPDFView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, request_id):
        # Fetch the MaterialRestockRequest by ID
        material_request = get_object_or_404(MaterialRestockRequest, pk=request_id)

        # Fetch the associated PurchaseOrder
        po = getattr(material_request, "purchase_order", None)
        if not po:
            return Response({"detail": "Purchase Order not found for this request."}, status=status.HTTP_404_NOT_FOUND)

        # Check if the PDF file exists
        if not po.pdf_file or not po.pdf_file.storage.exists(po.pdf_file.name):
            return Response({"detail": "PDF file not found for this Purchase Order."}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Return the PDF file as a response
            return FileResponse(po.pdf_file.open('rb'), content_type='application/pdf')
        except Exception as e:
            return Response({"detail": f"Error retrieving PDF file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)