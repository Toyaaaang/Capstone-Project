from django.contrib import admin
from .models import RoleRequestRecord 

class RoleRequestRecordAdmin(admin.ModelAdmin):
    list_display = ("user", "requested_role", "status", "processed_by", "processed_at")  # Columns to display in the list view
    list_filter = ("status", "processed_at")  # Filters for quick lookup
    search_fields = ("user__username", "requested_role", "processed_by__username")  # Searchable fields
    ordering = ("-processed_at",)  # Order by latest requests first

admin.site.register(RoleRequestRecord, RoleRequestRecordAdmin)
