import logging
from django.db.models import Sum
from rest_framework import views, status, serializers, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from .mpesa import MpesaGateWay
from groups.models import ChamaGroup, Contribution

logger = logging.getLogger(__name__)

class STKPushRequestSerializer(serializers.Serializer):
    group_id = serializers.IntegerField(help_text="The ID of the ChamaGroup")
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, help_text="Amount to contribute")

class STKPushView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = STKPushRequestSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        amount = request.data.get('amount')
        group_id = request.data.get('group_id')
        phone_number = request.user.phone_number

        if not amount or not group_id:
            return Response({"error": "amount and group_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            group = ChamaGroup.objects.get(id=group_id)
            
            # 1. Create the Pending Contribution first
            contribution = Contribution.objects.create(
                group=group,
                merchant=request.user,
                amount=amount,
                status='PENDING'
            )

            # 2. Trigger M-Pesa
            mpesa = MpesaGateWay()
            # live Render URL for the callback
            callback_url = "https://chama-cloud-api.onrender.com/api/payments/callback/"
            
            response = mpesa.trigger_stk_push(
                phone_number=phone_number,
                amount=amount,
                reference=group.name[:12], 
                callback_url=callback_url
            )

            # 3. Save the CheckoutRequestID so we can match it later
            if response.get('ResponseCode') == '0':
                contribution.checkout_request_id = response.get('CheckoutRequestID')
                contribution.save()
                return Response({
                    "message": "STK Push Initiated Successfully",
                    "checkout_request_id": contribution.checkout_request_id
                }, status=status.HTTP_200_OK)
            else:
                contribution.status = 'FAILED'
                contribution.save()
                return Response(response, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MpesaCallbackView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.info(f"M-Pesa Callback Received: {request.data}")
        
        body = request.data.get('Body', {})
        stk_callback = body.get('stkCallback', {})
        
        result_code = stk_callback.get('ResultCode')
        checkout_request_id = stk_callback.get('CheckoutRequestID')

        try:
            # Find the pending contribution
            contribution = Contribution.objects.filter(
                checkout_request_id=checkout_request_id,
                status='PENDING'
            ).last()
            
            if not contribution:
                logger.error(f"No pending contribution found for RequestID: {checkout_request_id}")
                return Response({"ResultCode": 0, "ResultDesc": "Accepted"}, status=status.HTTP_200_OK)

            if result_code == 0:
                # Payment was successful!
                callback_metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
                receipt_number = next((item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'), None)
                
                contribution.status = 'COMPLETED'
                contribution.mpesa_receipt_number = receipt_number
                contribution.save() # This triggers the group total update!
            else:
                # Payment failed or was cancelled
                contribution.status = 'FAILED'
                contribution.save()

        except Exception as e:
            logger.error(f"Callback processing error: {str(e)}")
        # Always return success to Safaricom so they stop retrying
        return Response({"ResultCode": 0, "ResultDesc": "Accepted"}, status=status.HTTP_200_OK)