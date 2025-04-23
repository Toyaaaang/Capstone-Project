from django.urls import path
from .views import SignRestockingView, RestockingRequestsListView

urlpatterns = [
    path('restocking/sign/<int:pk>/', SignRestockingView.as_view(), name='sign-restocking'),
    path('restocking/requests/', RestockingRequestsListView.as_view(), name='restocking-requests'),
]