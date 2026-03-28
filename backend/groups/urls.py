from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChamaGroupViewSet, ContributionViewSet

router = DefaultRouter()
router.register(r'list', ChamaGroupViewSet, basename='chamagroup')
router.register(r'contributions', ContributionViewSet, basename='contribution')

urlpatterns = [
    path('', include(router.urls)),
]