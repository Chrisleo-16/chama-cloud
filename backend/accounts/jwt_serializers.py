from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom serializer that includes user details (role, first_name, last_name, etc.)
    in the JWT token payload for easier client-side role-based routing.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims to the token
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["phone_number"] = user.phone_number
        token["role"] = user.role
        token["business_name"] = user.business_name or ""

        return token
