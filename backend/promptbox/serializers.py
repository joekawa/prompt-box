from rest_framework import serializers
from .models import (
    Organization, User, OrganizationMember, Team, TeamMember,
    Category, Prompt, TeamPrompt, PromptCategory, Folder
)

class FolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Folder
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']


class TeamSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ['id', 'name']


class UserManageSerializer(serializers.ModelSerializer):
    teams = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'created_at', 'teams']
        read_only_fields = ['id', 'created_at', 'teams']

    def get_teams(self, obj):
        request = self.context.get('request')
        org_id = None
        if request is not None:
            org_id = request.query_params.get('organization_id')

        teams = Team.objects.filter(
            members__user=obj,
            members__is_active=True,
            is_active=True,
        )

        if org_id:
            teams = teams.filter(organization_id=org_id)

        teams = teams.order_by('name')
        return TeamSummarySerializer(teams, many=True).data


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    organization_id = serializers.UUIDField(write_only=True)
    organization_role = serializers.CharField(write_only=True, required=False, default='MEMBER')

    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'password', 'organization_id', 'organization_role', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_organization_id(self, value):
        if not Organization.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError('Organization not found')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request is None or request.user.is_anonymous:
            raise serializers.ValidationError('Authentication required')

        org_id = attrs.get('organization_id')
        is_admin = OrganizationMember.objects.filter(
            organization_id=org_id,
            user=request.user,
            role='ADMIN',
        ).exists()
        if not is_admin:
            raise serializers.ValidationError('Admin role required to create users')

        return attrs

    def create(self, validated_data):
        org_id = validated_data.pop('organization_id')
        org_role = validated_data.pop('organization_role', 'MEMBER')
        password = validated_data.pop('password')

        user = User.objects.create_user(password=password, **validated_data)
        OrganizationMember.objects.create(organization_id=org_id, user=user, role=org_role)
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'name', 'password']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

class OrganizationMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.ReadOnlyField(source='user.name')

    class Meta:
        model = OrganizationMember
        fields = ['id', 'organization', 'user', 'user_email', 'user_name', 'role', 'created_at']

class TeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = '__all__'

class TeamMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    user_name = serializers.ReadOnlyField(source='user.name')

    class Meta:
        model = TeamMember
        fields = ['id', 'team', 'user', 'user_email', 'user_name', 'role', 'is_active', 'created_at']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class PromptCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = PromptCategory
        fields = ['id', 'category', 'category_name']

class TeamPromptSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = TeamPrompt
        fields = ['id', 'team', 'team_name']

class PromptSerializer(serializers.ModelSerializer):
    categories = PromptCategorySerializer(source='prompt_categories', many=True, read_only=True)
    shared_teams = TeamPromptSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.name')

    class Meta:
        model = Prompt
        fields = [
            'id', 'organization', 'created_by', 'created_by_name', 'name',
            'description', 'prompt', 'model', 'visibility', 'is_active',
            'created_at', 'updated_at', 'categories', 'shared_teams', 'folder'
        ]

class CreatePromptSerializer(serializers.ModelSerializer):
    # Serializer specifically for handling prompt creation including relations
    category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    team_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = Prompt
        fields = [
            'id', 'organization', 'name', 'description', 'prompt',
            'model', 'visibility', 'category_ids', 'team_ids', 'folder'
        ]

    def create(self, validated_data):
        category_ids = validated_data.pop('category_ids', [])
        team_ids = validated_data.pop('team_ids', [])

        prompt = Prompt.objects.create(**validated_data)

        for cat_id in category_ids:
            PromptCategory.objects.create(prompt=prompt, category_id=cat_id)

        for team_id in team_ids:
            TeamPrompt.objects.create(prompt=prompt, team_id=team_id)

        return prompt
