from rest_framework import serializers
from warehouse.models import MaterialRestockRequest
from warehouse.serializers import RestockItemSerializer
from requisition_voucher.models import RequisitionVoucher

class RequisitionVoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequisitionVoucher
        fields = ["rv_number", "pdf_file", "created_at"]

class RestockingRequestWithRVSerializer(serializers.ModelSerializer):
    requisition_vouchers = RequisitionVoucherSerializer(many=True)  # Handle multiple RVs

    class Meta:
        model = MaterialRestockRequest
        fields = [
            "id",
            "requested_by",
            "approved_at",
            "requisition_vouchers",
            "items",
        ]
        
class BudgetRestockingRequestSerializer(serializers.ModelSerializer):
    items = RestockItemSerializer(many=True, read_only=True)  # Ensure items are included
    requested_by = serializers.CharField(source="requested_by.username", read_only=True)
    processed_at = serializers.SerializerMethodField()

    class Meta:
        model = MaterialRestockRequest
        fields = [
            'id', 'requested_by', 'status', 'created_at', 'items', 'processed_at',
            'po_number', 'rv_number', 'approved_at', 'rejected_at', 
        ]

    def get_processed_at(self, obj):
        """Return either the approved_at or rejected_at timestamp, formatted."""
        processed_date = obj.approved_at if obj.status == "approved" else obj.rejected_at
        return processed_date.strftime("%Y-%m-%d %H:%M:%S") if processed_date else None