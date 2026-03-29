from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'phone_number', 'first_name', 'last_name', 'password', 'role', 
            'business_name', 'mpesa_shortcode', 'shortcode_type',
            # --- NEW KYC & STOREFRONT FIELDS ---
            'business_address', 'business_category', 
            'business_registration_number', 'kra_pin'
        ]

    def create(self, validated_data):
        role = validated_data.get('role', User.MERCHANT)

        # Your excellent custom validation check!
        if role == User.WHOLESALER and not validated_data.get('mpesa_shortcode'):
            raise serializers.ValidationError({"mpesa_shortcode": "Wholesalers must provide a Paybill or Till number."})

        user = User.objects.create_user(
            phone_number=validated_data['phone_number'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
            role=role,
            business_name=validated_data.get('business_name', ""),
            mpesa_shortcode=validated_data.get('mpesa_shortcode', None),
            shortcode_type=validated_data.get('shortcode_type', None),
            business_address=validated_data.get('business_address', ""),
            business_category=validated_data.get('business_category', ""),
            business_registration_number=validated_data.get('business_registration_number', ""),
            kra_pin=validated_data.get('kra_pin', "")
        )
        return user

class WholesalerSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'business_name', 'first_name', 'last_name', 'is_verified_wholesaler']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Get the standard access and refresh tokens
        data = super().validate(attrs)
        
        # Inject the user's specific data into the response
        data['role'] = self.user.role
        data['first_name'] = self.user.first_name
        
        # If they are a wholesaler, let the frontend know if they are verified yet
        if self.user.role == 'WHOLESALER':
            data['is_verified_wholesaler'] = self.user.is_verified_wholesaler
            
        return data