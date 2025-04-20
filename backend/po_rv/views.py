from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from reportlab.lib.pagesizes import A4
from django.utils.timezone import now
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
from authentication.permissions import IsBudgetAnalyst 
from rest_framework import generics, permissions
from rest_framework.exceptions import NotFound
from rest_framework.decorators import api_view, permission_classes

from django.http import FileResponse, Http404
from io import BytesIO
from reportlab.lib.units import inch
from datetime import date
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

from .models import DraftPurchaseOrder, PurchaseOrder
from warehouse.models import MaterialRestockRequest  # still referencing the request model
from .serializers import (
    DraftPurchaseOrderSerializer,
    PurchaseOrderSerializer,
)
from notification.utils import send_notification  # assuming this exists

class POPreviewView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk, *args, **kwargs):
        try:
            po = DraftPurchaseOrder.objects.get(pk=pk)
            restock_request = po.restocking_request

            # Check if restock_request is valid
            if not restock_request:
                raise ValueError("Restock request not found")

            items = restock_request.items.all()
            if not items:
                raise ValueError("No items found in restock request")

            # Extract the data for the PDF
            po_data = {
                "po_number": po.po_number,
                "request_reference": restock_request.request_reference,
                "items": [
                    {
                        "description": item.item_name,  # Use item_name instead of description
                        "unit": item.unit,
                        "quantity": item.quantity_requested,
                    } for item in items
                ]
            }

            pdf_file = generate_po_pdf(po_data)

            response = FileResponse(pdf_file, content_type="application/pdf")
            response["Content-Disposition"] = "inline; filename=po_preview.pdf"
            response["X-Frame-Options"] = "ALLOWALL"
            return response

        except DraftPurchaseOrder.DoesNotExist:
            return Response({"error": "Draft Purchase Order not found."}, status=404)
        except ValueError as ve:
            return Response({"error": str(ve)}, status=400)  # Return a bad request for missing data
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class FinalizePOView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            draft_po = DraftPurchaseOrder.objects.get(pk=pk, created_by=request.user, status='draft')
        except DraftPurchaseOrder.DoesNotExist:
            return Response({"error": "Draft PO not found or already finalized."}, status=status.HTTP_404_NOT_FOUND)

        # Generate final PO PDF
        pdf_bytes = generate_final_po_pdf(draft_po)

        # Create the finalized PO
        po = PurchaseOrder.objects.create(
            restocking_request=draft_po.restocking_request,
            created_by=draft_po.created_by,
            po_number=draft_po.po_number,
            total_amount=draft_po.fillable_fields.get('grand_total', 0),
            comments=draft_po.fillable_fields.get('remarks', ''),
            status='finalized'
        )

        # Mark draft as finalized
        draft_po.status = 'finalized'
        draft_po.save()

        # Notify the requester
        requester = draft_po.restocking_request.created_by
        send_notification(
            user=requester,
            message=f"Purchase Order {po.po_number} has been finalized for your restocking request."
        )

        return Response({
            "message": "PO finalized successfully.",
            "po_number": po.po_number
        }, status=status.HTTP_201_CREATED)
            
    
class SaveDraftPOView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            draft_po = DraftPurchaseOrder.objects.get(pk=pk, created_by=request.user)
        except DraftPurchaseOrder.DoesNotExist:
            return Response({"error": "Draft PO not found."}, status=status.HTTP_404_NOT_FOUND)

        fillable_data = request.data.get('fillable_fields')
        if not isinstance(fillable_data, dict):
            return Response({"error": "Invalid data for fillable_fields."}, status=status.HTTP_400_BAD_REQUEST)

        if draft_po.fillable_fields is None:
            draft_po.fillable_fields = {}

        draft_po.fillable_fields.update(fillable_data)
        draft_po.save()

        return Response({
            "message": "Draft saved.",
            "fillable_fields": draft_po.fillable_fields  # Send updated data back
        }, status=status.HTTP_200_OK)
class CreateDraftPOView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            restocking_request = MaterialRestockRequest.objects.get(pk=pk)

            if restocking_request.status != "approved":
                return Response({"error": "Restocking request is not approved."}, status=status.HTTP_400_BAD_REQUEST)

            user = request.user
            user_id = user.id
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            request_id = restocking_request.id

            po_number = f"PO-{user_id}-{timestamp}-{request_id}"
            rv_number = f"RV-{user_id}-{timestamp}-{request_id}"

            draft_po = DraftPurchaseOrder.objects.create(
                restocking_request=restocking_request,
                created_by=user,
                po_number=po_number
            )

            DraftReceivingVoucher.objects.create(
                purchase_order=draft_po,
                rv_number=rv_number
            )

            return Response({
                "message": "Draft PO and RV created successfully.",
                "po_number": po_number,
                "rv_number": rv_number
            }, status=status.HTTP_200_OK)

        except MaterialRestockRequest.DoesNotExist:
            return Response({"error": "Restocking request not found."}, status=status.HTTP_404_NOT_FOUND)


def generate_po_pdf(po_data):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # ========== HEADER ==========
    c.setFont("Helvetica-Bold", 14)
    c.drawString(200, height - 50, "PURCHASE ORDER")

    c.setFont("Helvetica", 10)
    c.drawString(50, height - 80, f"PO Number: {po_data.get('po_number', 'AUTO-GENERATED')}")
    c.drawString(300, height - 80, f"Date Issued: {date.today().strftime('%B %d, %Y')}")
    c.drawString(50, height - 100, f"Request Reference: {po_data.get('request_reference', 'N/A')}")

    # ========== SUPPLIER INFO ==========
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 130, "Supplier Information:")

    c.acroForm.textfield(
        name='supplier_name',
        value='ABC Supplies Inc.',
        x=50, y=height - 150, width=200, height=15, borderStyle='inset'
    )
    c.acroForm.textfield(
        name='supplier_address',
        value='Supplier Address',
        x=50, y=height - 170, width=400, height=30, borderStyle='inset')
    c.acroForm.textfield(
        name='contact_person',
        value='Contact Person',
        x=50, y=height - 205, width=200, height=15, borderStyle='inset')

    # ========== DELIVERY INFO ==========
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 230, "Delivery Information:")

    c.acroForm.textfield(
        name='delivery_address',
        value='Brgy. Poctol, Pitogo, Quezon \nQuezelco I, Warehouse',
        x=50, y=height - 250, width=400, height=30, borderStyle='inset')
    c.acroForm.textfield(
        name='expected_delivery',
        value='Expected Delivery Date',
        x=50, y=height - 285, width=200, height=15, borderStyle='inset')
    c.acroForm.textfield(
        name='delivery_terms',
        value='Delivery Terms',
        x=300, y=height - 285, width=200, height=15, borderStyle='inset')

    # ========== ITEMS TABLE ==========
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 310, "Items")

    headers = ["Description", "Unit", "Qty", "Unit Price", "Total"]
    x_positions = [50, 250, 310, 360, 430]
    for i, header in enumerate(headers):
        c.drawString(x_positions[i], height - 325, header)

    items = po_data.get("items", [])
    y = height - 340
    for idx, item in enumerate(items[:10]):  # limit to 10 for now
        c.setFont("Helvetica", 9)
        c.drawString(50, y, item['description'])
        c.drawString(250, y, item['unit'])
        c.drawString(310, y, str(item['quantity']))
        # Unit price (fillable)
        c.acroForm.textfield(name=f'unit_price_{idx}', x=360, y=y - 3, width=50, height=12)
        # Total (fillable)
        c.acroForm.textfield(name=f'total_{idx}', x=430, y=y - 3, width=60, height=12)
        y -= 20

    # ========== TOTALS (blank) ==========
    c.drawString(360, y - 10, "Subtotal:")
    c.acroForm.textfield(name='subtotal', x=430, y=y - 13, width=60, height=12)
    y -= 20
    c.drawString(360, y - 10, "VAT (12%):")
    c.acroForm.textfield(name='vat', x=430, y=y - 13, width=60, height=12)
    y -= 20
    c.drawString(360, y - 10, "Grand Total:")
    c.acroForm.textfield(name='grand_total', x=430, y=y - 13, width=60, height=12)

    # ========== REMARKS ==========
    c.drawString(50, y - 40, "Remarks:")
    c.acroForm.textfield(name='remarks', x=50, y=y - 60, width=300, height=30, borderStyle='inset')

    # ========== SIGNATORIES ==========
    c.drawString(50, y - 100, "Signatories:")
    signatory_roles = ["Prepared by", "Approved by", "Noted by"]
    sig_y = y - 120
    for role in signatory_roles:
        c.drawString(50, sig_y, role + ":")
        c.acroForm.textfield(name=f'signatory_{role.replace(" ", "_").lower()}',
                             x=130, y=sig_y - 3, width=200, height=12)
        sig_y -= 20

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer

def save_po_pdf_to_file(po_data, filename="po_final.pdf"):
    # Assuming po_data already has the generated PDF content
    buffer = po_data['pdf_content']  # This should be the content of the generated PDF
    content = ContentFile(buffer.read())
    file_path = default_storage.save(f"po_pdfs/{filename}", content)
    return file_path

def generate_final_po_pdf(draft_po):
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Header
    c.setFont("Helvetica-Bold", 14)
    c.drawString(200, height - 50, "PURCHASE ORDER")

    c.setFont("Helvetica", 10)
    c.drawString(50, height - 80, f"PO Number: {draft_po.po_number}")
    c.drawString(300, height - 80, f"Date Issued: {date.today().strftime('%B %d, %Y')}")
    c.drawString(50, height - 100, f"Request Reference: {draft_po.restocking_request.id}")

    # Supplier Info
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 130, "Supplier Information:")

    fields = draft_po.fillable_fields  # assuming this is a dict
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 150, f"Name: {fields.get('supplier_name', '')}")
    c.drawString(50, height - 165, f"Address: {fields.get('supplier_address', '')}")
    c.drawString(50, height - 180, f"Contact: {fields.get('contact_person', '')}")

    # Delivery Info
    c.setFont("Helvetica-Bold", 11)
    c.drawString(50, height - 210, "Delivery Information:")

    c.setFont("Helvetica", 10)
    c.drawString(50, height - 230, f"Address: {fields.get('delivery_address', '')}")
    c.drawString(50, height - 245, f"Expected Delivery: {fields.get('expected_delivery', '')}")
    c.drawString(300, height - 245, f"Terms: {fields.get('delivery_terms', '')}")

    # Items
    c.setFont("Helvetica-Bold", 10)
    c.drawString(50, height - 270, "Items")
    headers = ["Description", "Unit", "Qty", "Unit Price", "Total"]
    x_positions = [50, 250, 310, 360, 430]
    for i, header in enumerate(headers):
        c.drawString(x_positions[i], height - 285, header)

    items = fields.get("items", [])
    y = height - 300
    c.setFont("Helvetica", 9)
    for item in items:
        c.drawString(50, y, item['description'])
        c.drawString(250, y, item['unit'])
        c.drawString(310, y, str(item['quantity']))
        c.drawString(360, y, str(item.get('unit_price', '')))
        c.drawString(430, y, str(item.get('total', '')))
        y -= 15

    # Totals
    y -= 10
    c.setFont("Helvetica", 10)
    c.drawString(360, y, "Subtotal:")
    c.drawString(430, y, fields.get("subtotal", ""))
    y -= 15
    c.drawString(360, y, "VAT (12%):")
    c.drawString(430, y, fields.get("vat", ""))
    y -= 15
    c.drawString(360, y, "Grand Total:")
    c.drawString(430, y, fields.get("grand_total", ""))

    # Remarks
    y -= 40
    c.drawString(50, y, "Remarks:")
    y -= 15
    c.setFont("Helvetica-Oblique", 9)
    c.drawString(50, y, fields.get("remarks", ""))

    # Signatories
    y -= 40
    c.setFont("Helvetica", 10)
    c.drawString(50, y, "Signatories:")
    signatory_roles = ["Prepared by", "Approved by", "Noted by"]
    y -= 20
    for role in signatory_roles:
        name = fields.get(f"signatory_{role.replace(' ', '_').lower()}", "")
        c.drawString(50, y, f"{role}: {name}")
        y -= 15

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer