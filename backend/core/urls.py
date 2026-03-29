from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.views import APIView
from rest_framework.response import Response
from accounts.jwt_serializers import CustomTokenObtainPairSerializer
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.http import HttpResponse
from django.contrib.auth import get_user_model

class CustomTokenObtainPairView(APIView):
    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)

def setup_admin(request):
    User = get_user_model()
    phone = '0711111111'
    password = 'password123'
    
    if not User.objects.filter(phone_number=phone).exists():
        User.objects.create_superuser(phone_number=phone, password=password)
        return HttpResponse(f"SUCCESS: Superuser {phone} created on live database!")
    else:
        # If it exists, force a password reset just in case
        user = User.objects.get(phone_number=phone)
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        return HttpResponse(f"SUCCESS: Superuser {phone} password reset on live database!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/groups/', include('groups.urls')),
    path('api/payments/', include('payments.urls')),

    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('setup-admin/', setup_admin),
]