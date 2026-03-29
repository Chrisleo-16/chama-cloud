from rest_framework import serializers
from .models import ChamaGroup, Contribution, ClaimVoucher

class ContributionSerializer(serializers.ModelSerializer):
    # grabs the user's real name 
    merchant_name = serializers.CharField(source='merchant.get_full_name', read_only=True)

    class Meta:
        model = Contribution
        fields = ['id', 'group', 'merchant', 'merchant_name', 'amount', 'status', 'created_at']
        read_only_fields = ['status', 'mpesa_receipt_number', 'merchant']

class ChamaGroupSerializer(serializers.ModelSerializer):
    progress_percentage = serializers.SerializerMethodField()
    wholesaler_name = serializers.CharField(source='wholesaler.business_name', read_only=True)

    class Meta:
        model = ChamaGroup
        fields = [
            'id', 'name', 'description', 'target_amount', 'current_amount',
            'wholesaler', 'wholesaler_name', 'is_active', 'is_fully_funded',
            'progress_percentage', 'created_at'
        ]

    # Calculate the percentage for the React progress bars
    def get_progress_percentage(self, obj):
        target = float(obj.target_amount)
        current = float(obj.current_amount)
        
        if target > 0:
            percentage = (current / target) * 100
            return round(percentage, 1)
        return 0

class ClaimVoucherSerializer(serializers.ModelSerializer):
    # Pulling nested data to make the frontend's life easier
    group_name = serializers.CharField(source='group.name', read_only=True)
    wholesaler_name = serializers.CharField(source='group.wholesaler.business_name', read_only=True)

    class Meta:
        model = ClaimVoucher
        fields = [
            'id', 
            'group_name', 
            'wholesaler_name', 
            'amount_paid', 
            'is_claimed', 
            'created_at', 
            'claimed_at'
        ]