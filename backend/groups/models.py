from django.db import models
from django.conf import settings
from django.db.models import Sum
import uuid

class ChamaGroup(models.Model):
    name = models.CharField(max_length=255, help_text="e.g., Umoja Onion Traders")
    description = models.TextField(blank=True)
    target_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total needed for bulk purchase")
    current_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Link to the User model, specifically someone with the WHOLESALER role
    wholesaler = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='wholesale_orders'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.current_amount}/{self.target_amount}"

    @property
    def is_fully_funded(self):
        return self.current_amount >= self.target_amount


class Contribution(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    ]

    group = models.ForeignKey(ChamaGroup, on_delete=models.CASCADE, related_name='contributions')
    merchant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='contributions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    

    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    checkout_request_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.merchant.phone_number} - {self.amount} to {self.group.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Only count 'COMPLETED' contributions towards the progress bar
        completed_total = self.group.contributions.filter(
            status='COMPLETED'
        ).aggregate(Sum('amount'))['amount__sum'] or 0.00
        
        self.group.current_amount = completed_total
        if self.group.is_fully_funded and not self.group.vouchers.exists():
            
            merchants = self.group.contributions.filter(status='COMPLETED').values('merchant').annotate(total_paid=Sum('amount'))
            
            from .models import ClaimVoucher
            for m in merchants:
                ClaimVoucher.objects.create(
                    group=self.group,
                    merchant_id=m['merchant'],
                    amount_paid=m['total_paid']
                )
                
        self.group.save()

class ClaimVoucher(models.Model):
    # This ID will be the data embedded inside the QR Code
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    merchant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vouchers')
    group = models.ForeignKey(ChamaGroup, on_delete=models.CASCADE, related_name='vouchers')
    
    # We aggregate their total contribution so the wholesaler knows how much to give them
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    is_claimed = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    claimed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Voucher for {self.merchant.username} - {self.group.name}"