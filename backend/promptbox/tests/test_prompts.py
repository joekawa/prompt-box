from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from promptbox.models import User, Organization, OrganizationMember, Team, TeamMember, Category, Prompt, TeamPrompt, PromptCategory

class PromptTests(APITestCase):
    def setUp(self):
        self.client = APIClient()

        # Create User
        self.user = User.objects.create_user(email='test@example.com', password='password123', name='Test User')
        self.client.force_authenticate(user=self.user)

        # Create Organization
        self.org = Organization.objects.create(name='Test Org')

        # Add user to Organization
        OrganizationMember.objects.create(organization=self.org, user=self.user, role='ADMIN')

        # Create Team
        self.team = Team.objects.create(organization=self.org, name='Test Team')
        TeamMember.objects.create(team=self.team, user=self.user, role='MEMBER')

        # Create Category
        self.category = Category.objects.create(organization=self.org, name='Test Category')

        self.url = reverse('prompt-list') # Assuming 'prompt-list' is the basename from router

    def test_create_private_prompt(self):
        """
        Test creating a private prompt with basic fields.
        """
        data = {
            'organization': self.org.id,
            'name': 'My Private Prompt',
            'prompt': 'This is a test prompt.',
            'model': 'gpt-4',
            'visibility': 'PRIVATE'
        }

        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Prompt.objects.count(), 1)

        prompt = Prompt.objects.get()
        self.assertEqual(prompt.name, 'My Private Prompt')
        self.assertEqual(prompt.visibility, 'PRIVATE')
        self.assertEqual(prompt.created_by, self.user)

    def test_create_team_prompt(self):
        """
        Test creating a prompt shared with a team.
        """
        data = {
            'organization': self.org.id,
            'name': 'Team Shared Prompt',
            'prompt': 'This is a shared prompt.',
            'model': 'claude-2',
            'visibility': 'TEAM',
            'team_ids': [self.team.id]
        }

        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        prompt = Prompt.objects.get()
        self.assertEqual(prompt.visibility, 'TEAM')

        # Check TeamPrompt relation
        self.assertEqual(TeamPrompt.objects.count(), 1)
        self.assertEqual(TeamPrompt.objects.get().team, self.team)
        self.assertEqual(TeamPrompt.objects.get().prompt, prompt)

    def test_create_prompt_with_category(self):
        """
        Test creating a prompt associated with a category.
        """
        data = {
            'organization': self.org.id,
            'name': 'Categorized Prompt',
            'prompt': 'Prompt content.',
            'model': 'gpt-3.5-turbo',
            'category_ids': [self.category.id]
        }

        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        prompt = Prompt.objects.get()

        # Check PromptCategory relation
        self.assertEqual(PromptCategory.objects.count(), 1)
        self.assertEqual(PromptCategory.objects.get().category, self.category)
        self.assertEqual(PromptCategory.objects.get().prompt, prompt)

    def test_create_prompt_missing_fields(self):
        """
        Test validation for missing required fields.
        """
        data = {
            'organization': self.org.id,
            # Missing name, prompt, model
        }

        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)
        self.assertIn('prompt', response.data)
        self.assertIn('model', response.data)
