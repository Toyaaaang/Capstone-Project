from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'is_role_confirmed', 'role_requested_at', 'signature')}),
    )

admin.site.register(User, CustomUserAdmin)
