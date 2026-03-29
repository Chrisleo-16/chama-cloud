import requests
import base64
from datetime import datetime
from django.conf import settings

class MpesaGateWay:
    def __init__(self):
        self.consumer_key = settings.MPESA_CONSUMER_KEY
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET
        self.shortcode = settings.MPESA_SHORTCODE
        self.passkey = settings.MPESA_PASSKEY
        # Sandbox URLs
        self.auth_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        self.stk_push_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

    def get_access_token(self):
        if not self.consumer_key or not self.consumer_secret:
            raise Exception("CRITICAL: M-Pesa Keys are EMPTY! Render is not reading your Environment Variables.")

        try:
            import base64
            api_credentials = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_credentials = base64.b64encode(api_credentials.encode('utf-8')).decode('utf-8')
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}'
            }

            
            res = requests.get(
                self.auth_url, 
                headers=headers, 
                timeout=10
            )
            
            if res.status_code == 200:
                return res.json()['access_token']
            else:
                
                raise Exception(f"Safaricom Error {res.status_code}: {res.text}")
        except Exception as e:
            raise Exception(f"Failed to get access token: {str(e)}")

    def generate_password(self):
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        data_to_encode = self.shortcode + self.passkey + timestamp
        encoded_string = base64.b64encode(data_to_encode.encode())
        return encoded_string.decode('utf-8'), timestamp

    def trigger_stk_push(self, phone_number, amount, reference, callback_url):
        access_token = self.get_access_token()
        password, timestamp = self.generate_password()

        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        # Safaricom expects the phone number in 2547XXXXXXXX format
        if phone_number.startswith('0'):
            phone_number = '254' + phone_number[1:]
        elif phone_number.startswith('+'):
            phone_number = phone_number[1:]

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": int(float(amount)), 
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": callback_url,
            "AccountReference": str(reference),
            "TransactionDesc": f"Contribution to {reference}"
        }

        response = requests.post(self.stk_push_url, json=payload, headers=headers)
        return response.json()