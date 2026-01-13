from rest_framework import serializers
from .models import (
    Organization, User, OrganizationMember, Team, TeamMember,
    Category, Prompt, TeamPrompt, PromptCategory
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']

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
            'created_at', 'updated_at', 'categories', 'shared_teams'
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
            'model', 'visibility', 'category_ids', 'team_ids'
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
