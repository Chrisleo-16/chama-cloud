from rest_framework import serializers
from .models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['phone_number', 'first_name', 'last_name', 'password', 'role', 'business_name', 'mpesa_shortcode', 'shortcode_type']

    def create(self, validated_data):
        role = validated_data.get('role', User.MERCHANT)

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
            shortcode_type=validated_data.get('shortcode_type', None)
        )
        return user