from rest_framework import serializers
from .models import MaterialRestockRequest, RestockItem
from po_rv.models import DraftPurchaseOrder
from po_rv.serializers import DraftPurchaseOrderSerializer
from requisition_voucher.models import RequisitionVoucher
from .utils import generate_rv_pdf
from notification.utils import send_notification
from authentication.models import User
from django.core.files import File


class RestockItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestockItem
        fields = ['id', 'item_name', 'quantity_requested', 'unit']

    def validate_quantity_requested(self, value):
        """Ensure quantity is greater than zero."""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

class RequisitionVoucherRequestSerializer(serializers.ModelSerializer):
    items = RestockItemSerializer(many=True)  # Handle multiple items
    
    class Meta:
        model = MaterialRestockRequest
        fields = ['id', 'requested_by', 'status', 'created_at', 'items', 'draft_po']
        read_only_fields = ['requested_by', 'status', 'created_at']

    def create(self, validated_data):
        """Override create method to handle nested items correctly."""
        items_data = validated_data.pop('items', [])  # Default to empty list to prevent errors
        request = MaterialRestockRequest.objects.create(**validated_data)

        if not items_data:
            raise serializers.ValidationError("At least one item is required.")

        # Create restock items
        restock_items = [RestockItem(restock_request=request, **item) for item in items_data]
        RestockItem.objects.bulk_create(restock_items)  # Efficient bulk creation

        # Create the RequisitionVoucher object first to get the rv_number
        rv = RequisitionVoucher.objects.create(
            request=request,
            items=[item.to_dict() for item in restock_items],
        )

        # Generate the PDF using the actual rv_number
        pdf_file = generate_rv_pdf(
            filename=f"{rv.rv_number}.pdf",
            items=items_data,
            requested_by=request.requested_by.username,
            rv_number=rv.rv_number,  # Use the actual rv_number
        )

        request.rv_number = rv.rv_number
        request.save()

        # Update the RequisitionVoucher with the generated PDF file
        rv.pdf_file = pdf_file
        rv.save()

        # Send notifications to budget analysts
        budget_analysts = User.objects.filter(role="budget_analyst", is_role_confirmed=True)
        for analyst in budget_analysts:
            send_notification(
                analyst,
                f"New RV created for a restocking request by {request.requested_by.username}."
            )

        return request