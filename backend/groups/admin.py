from django.contrib import admin
from .models import ChamaGroup, Contribution

@admin.register(ChamaGroup)
class ChamaGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'target_amount', 'current_amount', 'is_active', 'is_fully_funded')
    list_filter = ('is_active',)
    search_fields = ('name',)

@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ('merchant', 'group', 'amount', 'status', 'mpesa_receipt_number', 'created_at')
    list_filter = ('status', 'group')
    search_fields = ('merchant__username', 'mpesa_receipt_number')