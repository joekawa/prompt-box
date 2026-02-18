from rest_framework import serializers
from .models import (
    Organization, User, OrganizationMember, Team, TeamMember,
    Category, Prompt, TeamPrompt, PromptCategory, Folder, PromptHistory,
    Workflow, WorkflowStep, WorkflowTeam, WorkflowHistory
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

class PromptHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.ReadOnlyField(source='changed_by.name')

    class Meta:
        model = PromptHistory
        fields = [
            'id', 'prompt', 'changed_by', 'changed_by_name',
            'change_summary', 'snapshot', 'created_at'
        ]
        read_only_fields = fields

class UpdatePromptSerializer(serializers.ModelSerializer):
    category_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    team_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )

    class Meta:
        model = Prompt
        fields = [
            'id', 'name', 'description', 'prompt',
            'model', 'visibility', 'category_ids', 'team_ids', 'folder'
        ]
        read_only_fields = ['id']

    def _build_snapshot(self, prompt):
        return {
            'name': prompt.name,
            'description': prompt.description,
            'prompt': prompt.prompt,
            'model': prompt.model,
            'visibility': prompt.visibility,
            'folder': str(prompt.folder_id) if prompt.folder_id else None,
            'category_ids': sorted([str(pc.category_id) for pc in prompt.prompt_categories.all()]),
            'team_ids': sorted([str(tp.team_id) for tp in prompt.shared_teams.all()]),
        }

    def update(self, instance, validated_data):
        category_ids = validated_data.pop('category_ids', None)
        team_ids = validated_data.pop('team_ids', None)

        # Build snapshot of old state
        old_snapshot = self._build_snapshot(instance)

        # Apply field updates
        changed_fields = []
        for attr, value in validated_data.items():
            old_value = getattr(instance, attr)
            if old_value != value:
                changed_fields.append(attr)
                setattr(instance, attr, value)
        instance.save()

        # Update categories if provided
        if category_ids is not None:
            old_cat_ids = set(str(pc.category_id) for pc in instance.prompt_categories.all())
            new_cat_ids = set(str(cid) for cid in category_ids)
            if old_cat_ids != new_cat_ids:
                changed_fields.append('categories')
                instance.prompt_categories.all().delete()
                for cat_id in category_ids:
                    PromptCategory.objects.create(prompt=instance, category_id=cat_id)

        # Update teams if provided
        if team_ids is not None:
            old_team_ids = set(str(tp.team_id) for tp in instance.shared_teams.all())
            new_team_ids = set(str(tid) for tid in team_ids)
            if old_team_ids != new_team_ids:
                changed_fields.append('teams')
                instance.shared_teams.all().delete()
                for tid in team_ids:
                    TeamPrompt.objects.create(prompt=instance, team_id=tid)

        # Create history record if anything changed
        if changed_fields:
            request = self.context.get('request')
            user = request.user if request else None
            summary = 'Updated ' + ', '.join(changed_fields)
            PromptHistory.objects.create(
                prompt=instance,
                changed_by=user,
                change_summary=summary,
                snapshot=old_snapshot,
            )

        return instance

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


class WorkflowStepSerializer(serializers.ModelSerializer):
    prompt_name = serializers.ReadOnlyField(source='prompt.name')

    class Meta:
        model = WorkflowStep
        fields = ['id', 'prompt', 'prompt_name', 'order', 'name']


class WorkflowTeamSerializer(serializers.ModelSerializer):
    team_name = serializers.ReadOnlyField(source='team.name')

    class Meta:
        model = WorkflowTeam
        fields = ['id', 'team', 'team_name']


class WorkflowSerializer(serializers.ModelSerializer):
    steps = WorkflowStepSerializer(many=True, read_only=True)
    shared_teams = WorkflowTeamSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.name')
    step_count = serializers.SerializerMethodField()

    class Meta:
        model = Workflow
        fields = [
            'id', 'organization', 'created_by', 'created_by_name', 'name',
            'description', 'visibility', 'is_active',
            'created_at', 'updated_at', 'steps', 'shared_teams', 'step_count'
        ]

    def get_step_count(self, obj):
        return obj.steps.count()


class WorkflowStepInputSerializer(serializers.Serializer):
    prompt = serializers.UUIDField()
    order = serializers.IntegerField(min_value=0)
    name = serializers.CharField(max_length=255, allow_blank=True, default='')


class CreateWorkflowSerializer(serializers.ModelSerializer):
    team_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    steps = WorkflowStepInputSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Workflow
        fields = ['id', 'name', 'description', 'visibility', 'team_ids', 'steps']

    def create(self, validated_data):
        team_ids = validated_data.pop('team_ids', [])
        steps_data = validated_data.pop('steps', [])

        workflow = Workflow.objects.create(**validated_data)

        for step in steps_data:
            WorkflowStep.objects.create(
                workflow=workflow,
                prompt_id=step['prompt'],
                order=step['order'],
                name=step.get('name', ''),
            )

        for tid in team_ids:
            WorkflowTeam.objects.create(workflow=workflow, team_id=tid)

        return workflow


class UpdateWorkflowSerializer(serializers.ModelSerializer):
    team_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True, required=False
    )
    steps = WorkflowStepInputSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Workflow
        fields = ['id', 'name', 'description', 'visibility', 'team_ids', 'steps']
        read_only_fields = ['id']

    def _build_snapshot(self, workflow):
        return {
            'name': workflow.name,
            'description': workflow.description,
            'visibility': workflow.visibility,
            'team_ids': sorted([str(wt.team_id) for wt in workflow.shared_teams.all()]),
            'steps': [
                {'prompt': str(s.prompt_id), 'order': s.order, 'name': s.name}
                for s in workflow.steps.order_by('order')
            ],
        }

    def update(self, instance, validated_data):
        team_ids = validated_data.pop('team_ids', None)
        steps_data = validated_data.pop('steps', None)

        old_snapshot = self._build_snapshot(instance)

        changed_fields = []
        for attr, value in validated_data.items():
            if getattr(instance, attr) != value:
                changed_fields.append(attr)
                setattr(instance, attr, value)
        instance.save()

        if team_ids is not None:
            old_team_ids = set(str(wt.team_id) for wt in instance.shared_teams.all())
            new_team_ids = set(str(tid) for tid in team_ids)
            if old_team_ids != new_team_ids:
                changed_fields.append('teams')
                instance.shared_teams.all().delete()
                for tid in team_ids:
                    WorkflowTeam.objects.create(workflow=instance, team_id=tid)

        if steps_data is not None:
            old_steps = [
                {'prompt': str(s.prompt_id), 'order': s.order, 'name': s.name}
                for s in instance.steps.order_by('order')
            ]
            new_steps = [
                {'prompt': str(s['prompt']), 'order': s['order'], 'name': s.get('name', '')}
                for s in steps_data
            ]
            if old_steps != new_steps:
                changed_fields.append('steps')
                instance.steps.all().delete()
                for step in steps_data:
                    WorkflowStep.objects.create(
                        workflow=instance,
                        prompt_id=step['prompt'],
                        order=step['order'],
                        name=step.get('name', ''),
                    )

        if changed_fields:
            request = self.context.get('request')
            user = request.user if request else None
            WorkflowHistory.objects.create(
                workflow=instance,
                changed_by=user,
                change_summary='Updated ' + ', '.join(changed_fields),
                snapshot=old_snapshot,
            )

        return instance


class WorkflowHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.ReadOnlyField(source='changed_by.name')

    class Meta:
        model = WorkflowHistory
        fields = [
            'id', 'workflow', 'changed_by', 'changed_by_name',
            'change_summary', 'snapshot', 'created_at'
        ]
        read_only_fields = fields
