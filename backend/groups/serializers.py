from rest_framework import serializers
from .models import ChamaGroup, Contribution

class ContributionSerializer(serializers.ModelSerializer):
    # grabs the user's real name 
    merchant_name = serializers.CharField(source='merchant.get_full_name', read_only=True)

    class Meta:
        model = Contribution
        fields = ['id', 'group', 'merchant', 'merchant_name', 'amount', 'status', 'created_at']
        read_only_fields = ['mpesa_receipt_number', 'merchant']

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
        if obj.target_amount > 0:
            percentage = (obj.current_amount / obj.target_amount) * 100
            return round(percentage, 1)
        return 0