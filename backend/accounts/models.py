from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    # Role Constants
    MERCHANT = 'MERCHANT'
    WHOLESALER = 'WHOLESALER'
    
    ROLE_CHOICES = [
        (MERCHANT, 'Merchant'),
        (WHOLESALER, 'Wholesaler'),
    ]

    phone_number = models.CharField(
        max_length=15, 
        unique=True, 
        help_text="Format: 2547XXXXXXXX"
    )
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default=MERCHANT
    )
    business_name = models.CharField(max_length=255, blank=True, null=True)

    # Use phone number for login instead of username 
    USERNAME_FIELD = 'phone_number' 

    def __str__(self):
        return f"{self.username} ({self.role})"