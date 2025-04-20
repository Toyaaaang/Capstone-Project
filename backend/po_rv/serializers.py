from rest_framework import serializers
from .models import (
    DraftPurchaseOrder,
    PurchaseOrder,
)

class DraftPurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = DraftPurchaseOrder
        fields = '__all__'


class PurchaseOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'
