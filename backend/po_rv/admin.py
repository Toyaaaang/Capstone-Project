from django.contrib import admin
from .models import PurchaseOrder

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ("po_number", "supplier", "rv_number", "grand_total", "created_at")
    search_fields = ("po_number", "supplier", "rv_number")
    list_filter = ("created_at",)