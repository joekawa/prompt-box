from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from promptbox.models import User, Organization, OrganizationMember, Team, TeamMember

class TeamTests(APITestCase):
    def setUp(self):
        # Create User
        self.user = User.objects.create_user(email='test@example.com', password='password123', name='Test User')
        self.client.force_authenticate(user=self.user)

        # Create Organization
        self.organization = Organization.objects.create(name='Test Org')
        OrganizationMember.objects.create(organization=self.organization, user=self.user, role='ADMIN')

        # Create another user for member testing
        self.other_user = User.objects.create_user(email='other@example.com', password='password123', name='Other User')
        OrganizationMember.objects.create(organization=self.organization, user=self.other_user, role='MEMBER')

    def test_create_team(self):
        url = reverse('team-list')
        data = {
            'organization': self.organization.id,
            'name': 'New Team',
            'description': 'A new team'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Team.objects.count(), 1)
        self.assertEqual(Team.objects.get().name, 'New Team')

    def test_list_teams_pagination_and_ordering(self):
        # Create multiple teams
        Team.objects.create(organization=self.organization, name='B Team', description='Second')
        Team.objects.create(organization=self.organization, name='A Team', description='First')
        Team.objects.create(organization=self.organization, name='C Team', description='Third')

        url = reverse('team-list')
        response = self.client.get(url, {'organization_id': self.organization.id, 'ordering': 'name'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]['name'], 'A Team')
        self.assertEqual(results[1]['name'], 'B Team')
        self.assertEqual(results[2]['name'], 'C Team')

    def test_update_team(self):
        team = Team.objects.create(organization=self.organization, name='Old Name')
        url = reverse('team-detail', args=[team.id])
        data = {'name': 'New Name'}
        response = self.client.patch(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        team.refresh_from_db()
        self.assertEqual(team.name, 'New Name')

    def test_delete_team(self):
        team = Team.objects.create(organization=self.organization, name='To Delete')
        url = reverse('team-detail', args=[team.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Team.objects.count(), 0)

    def test_add_team_member(self):
        team = Team.objects.create(organization=self.organization, name='My Team')
        url = reverse('team-add-member', args=[team.id])
        data = {'user_id': self.other_user.id, 'role': 'MEMBER'}

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(TeamMember.objects.filter(team=team, user=self.other_user).exists())

    def test_remove_team_member(self):
        team = Team.objects.create(organization=self.organization, name='My Team')
        TeamMember.objects.create(team=team, user=self.other_user, role='MEMBER')

        url = reverse('team-remove-member', args=[team.id])
        data = {'user_id': self.other_user.id}

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(TeamMember.objects.filter(team=team, user=self.other_user).exists())

    def test_add_member_not_in_org(self):
        # User not in org
        outsider = User.objects.create_user(email='outsider@example.com', password='password123', name='Outsider')

        team = Team.objects.create(organization=self.organization, name='My Team')
        url = reverse('team-add-member', args=[team.id])
        data = {'user_id': outsider.id, 'role': 'MEMBER'}

        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
