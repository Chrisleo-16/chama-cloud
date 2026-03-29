from django.urls import path
from .views import RegisterView, VerifiedWholesalersListView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('wholesalers/', VerifiedWholesalersListView.as_view(), name='wholesaler-list'),
]