from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from rest_framework import viewsets, permissions, status, filters, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .authentication import CsrfExemptSessionAuthentication

from .models import (
    Organization, User, OrganizationMember, Team, TeamMember,
    Category, Prompt
)
from .serializers import (
    OrganizationSerializer, UserSerializer, OrganizationMemberSerializer,
    TeamSerializer, TeamMemberSerializer, CategorySerializer,
    PromptSerializer, CreatePromptSerializer
)

class AuthViewSet(viewsets.ViewSet):
    """
    Viewset for Authentication flows (Login, Register, Logout).
    """
    permission_classes = [AllowAny]
    authentication_classes = [CsrfExemptSessionAuthentication]

    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Please provide both email and password'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=email, password=password)

        if user:
            login(request, user)
            serializer = UserSerializer(user)
            return Response({'status': 'success', 'user': serializer.data})
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        logout(request)
        return Response({'status': 'logged out'})

    @action(detail=False, methods=['post'])
    def register(self, request):
        # Basic registration logic
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(email=email, password=password, name=name)
        login(request, user)
        serializer = UserSerializer(user)
        return Response({'status': 'created', 'user': serializer.data}, status=status.HTTP_201_CREATED)

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        organization = self.get_object()
        email = request.data.get('email')
        role = request.data.get('role', 'MEMBER')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if OrganizationMember.objects.filter(organization=organization, user=user).exists():
             return Response({'error': 'User is already a member'}, status=status.HTTP_400_BAD_REQUEST)

        OrganizationMember.objects.create(organization=organization, user=user, role=role)
        return Response({'status': 'member added'})

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """List all members of the organization"""
        organization = self.get_object()
        members = OrganizationMember.objects.filter(organization=organization)
        serializer = OrganizationMemberSerializer(members, many=True)
        return Response(serializer.data)

class TeamViewSet(viewsets.ModelViewSet):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get_queryset(self):
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            return Team.objects.filter(organization_id=org_id)
        return Team.objects.all()

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """List all members of the team"""
        team = self.get_object()
        members = TeamMember.objects.filter(team=team)
        serializer = TeamMemberSerializer(members, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add a user to the team"""
        team = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'MEMBER')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if TeamMember.objects.filter(team=team, user=user).exists():
            return Response({'error': 'User is already in the team'}, status=status.HTTP_400_BAD_REQUEST)

        # Verify user is in the organization
        if not OrganizationMember.objects.filter(organization=team.organization, user=user).exists():
             return Response({'error': 'User is not a member of the organization'}, status=status.HTTP_400_BAD_REQUEST)

        TeamMember.objects.create(team=team, user=user, role=role)
        return Response({'status': 'member added'})

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        """Remove a user from the team"""
        team = self.get_object()
        user_id = request.data.get('user_id')

        try:
            member = TeamMember.objects.get(team=team, user_id=user_id)
            member.delete()
            return Response({'status': 'member removed'})
        except TeamMember.DoesNotExist:
            return Response({'error': 'Member not found in team'}, status=status.HTTP_404_NOT_FOUND)

class PromptViewSet(viewsets.ModelViewSet):
    queryset = Prompt.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description', 'prompt', 'prompt_categories__category__name']

    def get_serializer_class(self):
        if self.action == 'create':
            return CreatePromptSerializer
        return PromptSerializer

    def get_queryset(self):
        # Filter by organization
        queryset = Prompt.objects.all()
        org_id = self.request.query_params.get('organization_id')
        team_id = self.request.query_params.get('team_id')

        if org_id:
            queryset = queryset.filter(organization_id=org_id)

        if team_id:
            # Filter prompts shared with this team
            queryset = queryset.filter(shared_teams__team_id=team_id)

        # In a real scenario, we would also filter by:
        # 1. Prompts created by the user (My Prompts)
        # 2. Prompts shared with teams the user is a member of
        # queryset = queryset.filter(Q(created_by=self.request.user) | Q(shared_teams__team__members__user=self.request.user)).distinct()

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    def get_queryset(self):
        org_id = self.request.query_params.get('organization_id')
        if org_id:
            return Category.objects.filter(organization_id=org_id)
        return Category.objects.all()

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
