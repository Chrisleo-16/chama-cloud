from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChamaGroupViewSet, ContributionViewSet, MerchantVoucherListView, WholesalerGroupListView, WholesalerVoucherListView, ScanVoucherView

router = DefaultRouter()
router.register(r'list', ChamaGroupViewSet, basename='chamagroup')
router.register(r'contributions', ContributionViewSet, basename='contribution')

urlpatterns = [
    path('vouchers/', MerchantVoucherListView.as_view(), name='voucher-list'),

    path('wholesaler/groups/', WholesalerGroupListView.as_view(), name='wholesaler-groups'),
    path('wholesaler/vouchers/', WholesalerVoucherListView.as_view(), name='wholesaler-vouchers'),
    path('wholesaler/scan/<uuid:voucher_id>/', ScanVoucherView.as_view(), name='scan-voucher'),
    
    path('', include(router.urls)),
]