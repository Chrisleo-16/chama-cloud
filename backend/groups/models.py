from django.db import models
from django.conf import settings

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
    
    # We will populate this when the M-Pesa callback hits our server
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.merchant.username} - {self.amount} to {self.group.name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        
        # Only count 'COMPLETED' contributions towards the progress bar
        completed_total = self.group.contributions.filter(
            status='COMPLETED'
        ).aggregate(Sum('amount'))['amount__sum'] or 0.00
        
        self.group.current_amount = completed_total
        self.group.save()