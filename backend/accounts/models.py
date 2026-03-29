from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('The Phone Number must be set')
        
        user = self.model(phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone_number, password, **extra_fields)


class User(AbstractUser):
    username = None  # Completely remove the default username field
    
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
    
    # We rely on AbstractUser's built-in first_name and last_name fields
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=MERCHANT)
    business_name = models.CharField(max_length=255, blank=True, null=True)
    business_address = models.TextField(blank=True, null=True, help_text="Physical location for order pickups")
    business_category = models.CharField(max_length=100, blank=True, null=True)

    business_registration_number = models.CharField(max_length=100, blank=True, null=True)
    kra_pin = models.CharField(max_length=20, blank=True, null=True)

    mpesa_shortcode = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        help_text="Wholesaler Paybill or Till Number"
    )
    # Daraja B2B needs to know if it's sending to a Paybill (4) or Till (Buy Goods - 2)
    SHORTCODE_TYPE_CHOICES = [
        ('PAYBILL', 'Paybill'),
        ('TILL', 'Till Number (Buy Goods)'),
    ]
    shortcode_type = models.CharField(
        max_length=10, 
        choices=SHORTCODE_TYPE_CHOICES, 
        blank=True, 
        null=True
    )

    is_verified_wholesaler = models.BooleanField(
        default=False, 
        help_text="Admin toggles this to True after verifying business docs."
    )

    USERNAME_FIELD = 'phone_number'
    # This tells createsuperuser what to prompt you for
    REQUIRED_FIELDS = ['first_name', 'last_name'] 

    objects = CustomUserManager()

    def __str__(self):
        # Displays "Roney Muganda (2547XXXXXXXX)" in the admin panel
        return f"{self.first_name} {self.last_name} ({self.phone_number})"