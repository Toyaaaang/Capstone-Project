from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, CustomTokenObtainPairView, 
    ConfirmRoleView, GetUserView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("confirm-role/<int:user_id>/", ConfirmRoleView.as_view(), name="confirm_role"),
    path("user/", GetUserView.as_view(), name="get_user"),
]
