from django.contrib.auth import authenticate, login, logout
from django.db.models import Q
from rest_framework import viewsets, permissions, status, filters, views, pagination
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .authentication import CsrfExemptSessionAuthentication

from .models import (
    Organization, User, OrganizationMember, Team, TeamMember,
    Category, Prompt, Folder
)
from .serializers import (
    OrganizationSerializer, UserSerializer, OrganizationMemberSerializer,
    TeamSerializer, TeamMemberSerializer, CategorySerializer,
    PromptSerializer, CreatePromptSerializer, FolderSerializer,
    UserManageSerializer, UserCreateSerializer, UserUpdateSerializer
)

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

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
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

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
    serializer_class = PromptSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'prompt', 'prompt_categories__category__name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'create':
            return CreatePromptSerializer
        return PromptSerializer

    def get_queryset(self):
        # Filter by organization
        user = self.request.user
        # Restrict to organizations the user is a member of
        user_org_ids = OrganizationMember.objects.filter(user=user).values_list('organization_id', flat=True)
        queryset = Prompt.objects.filter(organization_id__in=user_org_ids)

        org_id = self.request.query_params.get('organization_id')
        team_id = self.request.query_params.get('team_id')
        visibility = self.request.query_params.get('visibility')
        created_by = self.request.query_params.get('created_by')
        folder_id = self.request.query_params.get('folder_id')

        if org_id:
            queryset = queryset.filter(organization_id=org_id)

        if team_id:
            # Filter prompts shared with this team
            queryset = queryset.filter(shared_teams__team_id=team_id)

        if visibility:
            queryset = queryset.filter(visibility=visibility)

        if created_by:
            if created_by == 'me':
                queryset = queryset.filter(created_by=self.request.user)
            else:
                queryset = queryset.filter(created_by_id=created_by)

        if folder_id:
            if folder_id == 'root':
                queryset = queryset.filter(folder__isnull=True)
            else:
                queryset = queryset.filter(folder_id=folder_id)

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

class FolderViewSet(viewsets.ModelViewSet):
    queryset = Folder.objects.all()
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        user_org_ids = OrganizationMember.objects.filter(user=user).values_list('organization_id', flat=True)
        queryset = Folder.objects.filter(organization_id__in=user_org_ids)

        org_id = self.request.query_params.get('organization_id')
        parent_id = self.request.query_params.get('parent_id')
        folder_type = self.request.query_params.get('type')
        user_id = self.request.query_params.get('user_id')
        team_id = self.request.query_params.get('team_id')
        root_only = self.request.query_params.get('root_only')

        if org_id:
            queryset = queryset.filter(organization_id=org_id)

        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        elif root_only == 'true':
             queryset = queryset.filter(parent__isnull=True)

        if folder_type:
            queryset = queryset.filter(type=folder_type)

        if user_id:
            queryset = queryset.filter(user_id=user_id)

        if team_id:
            queryset = queryset.filter(team_id=team_id)

        return queryset

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    authentication_classes = [CsrfExemptSessionAuthentication]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        if self.action == 'me':
            return UserSerializer
        return UserManageSerializer

    def get_queryset(self):
        request_user = self.request.user
        user_org_ids = OrganizationMember.objects.filter(user=request_user).values_list('organization_id', flat=True)
        queryset = User.objects.filter(
            is_active=True,
            organization_memberships__organization_id__in=user_org_ids,
        ).distinct()

        org_id = self.request.query_params.get('organization_id')
        if org_id:
            queryset = queryset.filter(organization_memberships__organization_id=org_id)

        return queryset

    def _require_admin(self, organization_id):
        if not OrganizationMember.objects.filter(
            organization_id=organization_id,
            user=self.request.user,
            role='ADMIN',
        ).exists():
            return Response({'error': 'Admin role required'}, status=status.HTTP_403_FORBIDDEN)
        return None

    def _get_shared_organization_id(self, target_user):
        org_id = self.request.data.get('organization_id') or self.request.query_params.get('organization_id')
        if org_id:
            return org_id

        request_org_ids = set(OrganizationMember.objects.filter(user=self.request.user).values_list('organization_id', flat=True))
        target_org_ids = OrganizationMember.objects.filter(user=target_user).values_list('organization_id', flat=True)
        for candidate in target_org_ids:
            if candidate in request_org_ids:
                return str(candidate)
        return None

    def perform_update(self, serializer):
        org_id = self._get_shared_organization_id(self.get_object())
        if org_id:
            forbidden = self._require_admin(org_id)
            if forbidden is not None:
                raise PermissionDenied(forbidden.data.get('error'))
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        org_id = self._get_shared_organization_id(user)
        if not org_id:
            return Response({'error': 'organization_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        forbidden = self._require_admin(org_id)
        if forbidden is not None:
            return forbidden

        user.is_active = False
        user.save(update_fields=['is_active'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_team(self, request, pk=None):
        user = self.get_object()
        team_id = request.data.get('team_id')
        if not team_id:
            return Response({'error': 'team_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            team = Team.objects.get(id=team_id, is_active=True)
        except Team.DoesNotExist:
            return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)

        forbidden = self._require_admin(str(team.organization_id))
        if forbidden is not None:
            return forbidden

        if not OrganizationMember.objects.filter(organization=team.organization, user=user).exists():
            return Response({'error': 'User is not a member of the organization'}, status=status.HTTP_400_BAD_REQUEST)

        membership, created = TeamMember.objects.get_or_create(
            team=team,
            user=user,
            defaults={'role': 'MEMBER', 'is_active': True},
        )
        if not created and not membership.is_active:
            membership.is_active = True
            membership.save(update_fields=['is_active'])

        return Response({'status': 'team assigned'})

    @action(detail=True, methods=['post'])
    def remove_team(self, request, pk=None):
        user = self.get_object()
        team_id = request.data.get('team_id')
        if not team_id:
            return Response({'error': 'team_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            team = Team.objects.get(id=team_id, is_active=True)
        except Team.DoesNotExist:
            return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)

        forbidden = self._require_admin(str(team.organization_id))
        if forbidden is not None:
            return forbidden

        membership = TeamMember.objects.filter(team=team, user=user, is_active=True).first()
        if membership is None:
            return Response({'error': 'User is not a member of the team'}, status=status.HTTP_404_NOT_FOUND)

        active_team_count = TeamMember.objects.filter(
            user=user,
            is_active=True,
            team__organization=team.organization,
            team__is_active=True,
        ).count()
        if active_team_count <= 1:
            return Response({'error': 'User must be assigned to at least one team'}, status=status.HTTP_400_BAD_REQUEST)

        membership.is_active = False
        membership.save(update_fields=['is_active'])
        return Response({'status': 'team removed'})
