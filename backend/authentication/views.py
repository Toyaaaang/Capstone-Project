from rest_framework import generics, status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from .serializers import UserSerializer, LoginSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from notification.models import Notification
from notification.serializers import NotificationSerializer

User = get_user_model()

# Custom Token Serializer to Include Role and Role Confirmation
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["is_role_confirmed"] = user.is_role_confirmed
        return token

# Custom Token View
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    
# Function to Generate Notification Message Dynamically
def generate_notification_message(user):
    username = user.username
    role = user.role

    if role != "employee":
        return f"Welcome to the Warehouse Operations Management System!\nHi {username}, your requested role as '{role}' is pending admin approval."
    else:
        return (
            f"Welcome {username} to the Warehouse Operations Management System! "
            "As an employee, you can request materials and track your requisitions seamlessly."
        )
        
# Register User
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        
        # Generate notification message dynamically
        message = generate_notification_message(user)

        # Create a notification for role confirmation
        Notification.objects.create(user=user, message=message)
    
# Login View (Token-Based)
class LoginView(views.APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data["user"]
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "role": user.role,
                "is_role_confirmed": user.is_role_confirmed,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Logout View
class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

# View to Confirm User Role (Only Admins Can Confirm)
class ConfirmRoleView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "warehouse admin":
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=user_id)
            user.is_role_confirmed = True
            user.save()
            return Response({"message": f"{user.username}'s role confirmed!"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

# Fetch User Details for Role-Based Redirect
class GetUserView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "role": user.role,
            "is_role_confirmed": user.is_role_confirmed
        })
