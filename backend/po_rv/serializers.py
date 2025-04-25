from rest_framework import serializers
from po_rv.models import PurchaseOrder
from warehouse.models import MaterialRestockRequest

class PurchaseOrderSerializer(serializers.ModelSerializer):
    restocking_request_id = serializers.IntegerField(write_only=True)  # Accept restocking request ID from the frontend

    class Meta:
        model = PurchaseOrder
        fields = [
            "id",
            "po_number",
            "supplier",
            "shipping_instructions",
            "rv_number",
            "restocking_request_id",
            "address",
            "grand_total",
            "pdf_file",
            "created_at",
        ]
        read_only_fields = ["po_number", "rv_number", "pdf_file", "created_at"]

    def validate(self, data):
        """
        Custom validation to ensure the restocking request exists and is valid.
        """
        restocking_request_id = data.get("restocking_request_id")
        if not restocking_request_id:
            raise serializers.ValidationError({"restocking_request_id": "This field is required."})

        try:
            restocking_request = MaterialRestockRequest.objects.get(id=restocking_request_id)
        except MaterialRestockRequest.DoesNotExist:
            raise serializers.ValidationError({"restocking_request_id": "Invalid restocking request ID."})

        # Check if a PO already exists for this restocking request
        if hasattr(restocking_request, "purchase_order"):
            raise serializers.ValidationError({"restocking_request_id": "A PO already exists for this restocking request."})

        data["restocking_request"] = restocking_request
        return data

    def create(self, validated_data):
        """
        Create a Purchase Order and generate the PDF.
        """
        restocking_request = validated_data.pop("restocking_request")
        po = PurchaseOrder.objects.create(
            restocking_request=restocking_request,
            rv_number=restocking_request.requisitionvoucher.rv_number,
            **validated_data,
        )

        # Generate the PO PDF
        from .utils import create_purchase_order_pdf
        pdf_filename = f"PO-{po.po_number}.pdf"
        create_purchase_order_pdf(pdf_filename, {
            "po_number": po.po_number,
            "supplier": po.supplier,
            "address": po.address,
            "rv_number": po.rv_number,
            "date": po.created_at.strftime("%Y-%m-%d"),
            "items": [
                {
                    "unit": item.unit,
                    "description": item.item_name,
                    "quantity": item.quantity_requested,
                    "unit_price": item.unit_price,
                    "total_price": item.quantity_requested * item.unit_price,
                }
                for item in restocking_request.items.all()
            ],
            "grand_total": po.grand_total,
            "authorized_by": "Authorized Person",  # Replace with actual authorized person
        })

        # Save the generated PDF to the PO
        with open(pdf_filename, "rb") as pdf_file:
            po.pdf_file.save(pdf_filename, pdf_file)

        return po
