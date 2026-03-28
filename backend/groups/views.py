from rest_framework import viewsets, permissions
from .models import ChamaGroup, Contribution
from .serializers import ChamaGroupSerializer, ContributionSerializer

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