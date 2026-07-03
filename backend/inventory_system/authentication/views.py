from django.contrib.auth.models import User
from rest_framework import generics,status
from rest_framework.permissions import AllowAny,IsAuthenticated
from .serializers import RegisterSerializer, UserSerializer
from rest_framework.response import Response


class RegisterAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (AllowAny,)

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response(
            {
                "message": "User registered successfully.",
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                }
            },
            status=status.HTTP_201_CREATED
        )

class MeAPIView(generics.RetrieveAPIView):
    """
    Returns the currently authenticated user's details.
    Requires a valid JWT access token in the Authorization header.
    """
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user
    