from django.contrib import admin
from .models import DraftPurchaseOrder, PurchaseOrder

# Admin configuration for DraftPurchaseOrder
class DraftPurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('po_number', 'restocking_request', 'status', 'created_by', 'created_at')
    search_fields = ('po_number', 'status', 'created_by__username')
    list_filter = ('status', 'created_by')

# Admin configuration for PurchaseOrder
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('po_number', 'restocking_request', 'total_amount', 'status', 'created_by', 'created_at')
    search_fields = ('po_number', 'status', 'created_by__username', 'total_amount')
    list_filter = ('status', 'created_by')

# Registering models with custom admin
admin.site.register(DraftPurchaseOrder, DraftPurchaseOrderAdmin)
admin.site.register(PurchaseOrder, PurchaseOrderAdmin)
