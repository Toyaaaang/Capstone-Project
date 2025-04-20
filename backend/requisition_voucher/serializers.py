from rest_framework import serializers
from .models import RequisitionVoucher

class RequisitionVoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = RequisitionVoucher
        fields = ['id', 'rv_number', 'request', 'created_at', 'items', 'pdf_file']
class RequisitionItemSerializer(serializers.Serializer):
    item_name = serializers.CharField()
    quantity_requested = serializers.IntegerField(min_value=1)

class CreateRequisitionVoucherSerializer(serializers.Serializer):
    request_id = serializers.IntegerField()
    items = RequisitionItemSerializer(many=True)

    def create(self, validated_data):
        from .models import RequisitionVoucher, RequisitionItem

        request_id = validated_data['request_id']
        items_data = validated_data['items']
        
        # Assuming you have a ForeignKey to `RestockingRequest` or similar
        rv = RequisitionVoucher.objects.create(request_id=request_id)

        # Create RV items
        for item in items_data:
            RequisitionItem.objects.create(
                requisition_voucher=rv,
                item_name=item['item_name'],
                quantity_requested=item['quantity_requested']
            )

        return rv
