from rest_framework import viewsets, permissions
from .models import ChamaGroup, Contribution, ClaimVoucher
from .serializers import ChamaGroupSerializer, ContributionSerializer, ClaimVoucherSerializer
from django.utils import timezone
from rest_framework.views import APIView

class ChamaGroupViewSet(viewsets.ModelViewSet):
    queryset = ChamaGroup.objects.all().order_by('-created_at')
    serializer_class = ChamaGroupSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class ContributionViewSet(viewsets.ModelViewSet):
    queryset = Contribution.objects.all().order_by('-created_at')
    serializer_class = ContributionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return super().get_queryset()

    def perform_create(self, serializer):
        # Automatically assign the logged-in user as the merchant making the contribution
        serializer.save(merchant=self.request.user)

class MerchantVoucherListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ClaimVoucherSerializer

    def get_queryset(self):
        # Filter vouchers strictly to the logged-in merchant
        return ClaimVoucher.objects.filter(
            merchant=self.request.user
        ).order_by('-created_at')

class WholesalerGroupListView(generics.ListAPIView):
    """Returns all ChamaGroups assigned to this specific wholesaler"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChamaGroupSerializer

    def get_queryset(self):
        # Only return groups where the logged-in user is the assigned wholesaler
        return ChamaGroup.objects.filter(
            wholesaler=self.request.user
        ).order_by('-created_at')


class WholesalerVoucherListView(generics.ListAPIView):
    """Returns all Vouchers that this wholesaler needs to fulfill"""
    permission_classes = [IsAuthenticated]
    serializer_class = ClaimVoucherSerializer

    def get_queryset(self):
        # Filter vouchers where the group's wholesaler matches the logged-in user
        # We order by 'is_claimed' so the pending ones stay at the top!
        return ClaimVoucher.objects.filter(
            group__wholesaler=self.request.user
        ).order_by('is_claimed', '-created_at')

class ScanVoucherView(APIView):
    """Allows a wholesaler to mark a specific voucher as claimed"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, voucher_id):
        try:
            # 1. Find the voucher AND ensure this wholesaler actually owns it
            voucher = ClaimVoucher.objects.get(
                id=voucher_id, 
                group__wholesaler=request.user
            )
            
            # 2. Check if it was already claimed (Prevent double-dipping!)
            if voucher.is_claimed:
                return Response(
                    {"error": "Fraud Alert: This voucher has already been claimed!"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 3. Mark it as claimed
            voucher.is_claimed = True
            voucher.claimed_at = timezone.now()
            voucher.save()

            return Response({
                "message": "Voucher verified and claimed successfully!",
                "merchant": voucher.merchant.first_name,
                "amount_to_dispense": str(voucher.amount_paid)
            }, status=status.HTTP_200_OK)

        except ClaimVoucher.DoesNotExist:
            return Response(
                {"error": "Invalid QR Code or you are not authorized to fulfill this order."}, 
                status=status.HTTP_404_NOT_FOUND
            )