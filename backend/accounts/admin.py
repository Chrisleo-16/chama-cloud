from django.contrib import admin
from .models import User

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('phone_number', 'first_name', 'role', 'business_name', 'is_verified_wholesaler')
    list_filter = ('role', 'is_verified_wholesaler')
    search_fields = ('phone_number', 'business_name')