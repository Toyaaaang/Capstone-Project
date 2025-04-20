from django.contrib import admin
from .models import MaterialRestockRequest, RestockItem

class RestockItemInline(admin.TabularInline):
    model = RestockItem
    extra = 1

@admin.register(MaterialRestockRequest)
class MaterialRestockRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'requested_by', 'status', 'po_number', 'rv_number', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['id', 'requested_by__username', 'po_number', 'rv_number']
    ordering = ['-created_at']
    inlines = [RestockItemInline]

admin.site.register(RestockItem)
