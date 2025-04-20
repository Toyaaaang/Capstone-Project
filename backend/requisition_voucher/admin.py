from django.contrib import admin
from .models import RequisitionVoucher

@admin.register(RequisitionVoucher)
class RequisitionVoucherAdmin(admin.ModelAdmin):
    list_display = ['rv_number', 'request', 'created_at']
    readonly_fields = ['rv_number', 'created_at']
    list_filter = ['created_at']
