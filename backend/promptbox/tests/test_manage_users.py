from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from promptbox.models import User, Organization, OrganizationMember, Team, TeamMember


class ManageUsersApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()

        # Organizations
        self.org = Organization.objects.create(name='Acme Corp')
        self.other_org = Organization.objects.create(name='Globex')

        # Admin user for org
        self.admin = User.objects.create_user(email='admin@test.com', password='password123', name='Admin User')
        OrganizationMember.objects.create(organization=self.org, user=self.admin, role='ADMIN')

        # Regular users in org
        self.user_a = User.objects.create_user(email='a@test.com', password='password123', name='Alice')
        self.user_b = User.objects.create_user(email='b@test.com', password='password123', name='Bob')
        OrganizationMember.objects.create(organization=self.org, user=self.user_a, role='MEMBER')
        OrganizationMember.objects.create(organization=self.org, user=self.user_b, role='MEMBER')

        # Ensure teams exist (default team should exist via signals)
        self.default_team = Team.objects.get(organization=self.org, name=self.org.name)
        self.eng_team = Team.objects.create(organization=self.org, name='Engineering')

        # Add one user to extra team
        TeamMember.objects.create(team=self.eng_team, user=self.user_a, role='MEMBER')

        # Another org user that should not appear in listing
        self.other_user = User.objects.create_user(email='x@other.com', password='password123', name='Xavier')
        OrganizationMember.objects.create(organization=self.other_org, user=self.other_user, role='MEMBER')

        self.client.force_authenticate(user=self.admin)

    def test_list_users_scoped_sorted_paginated_and_includes_teams(self):
        url = reverse('user-list')
        response = self.client.get(url, {'organization_id': str(self.org.id)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Pagination
        self.assertIn('results', response.data)
        self.assertIn('count', response.data)

        results = response.data['results']
        # Should include admin + Alice + Bob (3)
        self.assertEqual(response.data['count'], 3)

        # Sorted by name
        names = [u['name'] for u in results]
        self.assertEqual(names, sorted(names))

        # Includes teams field
        alice = next(u for u in results if u['email'] == 'a@test.com')
        self.assertIn('teams', alice)
        team_names = [t['name'] for t in alice['teams']]
        self.assertIn(self.org.name, team_names)  # default team
        self.assertIn('Engineering', team_names)

        # Ensure other org user is not present
        emails = [u['email'] for u in results]
        self.assertNotIn('x@other.com', emails)

    def test_create_user_creates_org_membership_and_default_team_membership(self):
        url = reverse('user-list')
        data = {
            'email': 'new@test.com',
            'name': 'New User',
            'password': 'password123',
            'organization_id': str(self.org.id),
            'organization_role': 'MEMBER',
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        created_user = User.objects.get(email='new@test.com')
        self.assertTrue(OrganizationMember.objects.filter(organization=self.org, user=created_user).exists())

        # Business rule: default team membership exists
        self.assertTrue(TeamMember.objects.filter(team=self.default_team, user=created_user).exists())

    def test_update_user_requires_admin(self):
        # Authenticate as non-admin
        self.client.force_authenticate(user=self.user_a)

        url = reverse('user-detail', kwargs={'pk': str(self.user_b.id)})
        response = self.client.patch(url, {'name': 'Bob Updated'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_soft_delete_user(self):
        url = reverse('user-detail', kwargs={'pk': str(self.user_b.id)})
        response = self.client.delete(url, {'organization_id': str(self.org.id)}, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.user_b.refresh_from_db()
        self.assertFalse(self.user_b.is_active)

    def test_assign_and_remove_team(self):
        # Assign Bob to Engineering team
        assign_url = reverse('user-assign-team', kwargs={'pk': str(self.user_b.id)})
        response = self.client.post(assign_url, {'team_id': str(self.eng_team.id)}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(TeamMember.objects.filter(team=self.eng_team, user=self.user_b, is_active=True).exists())

        # Remove Bob from Engineering team - should succeed because Bob is still in default team
        remove_url = reverse('user-remove-team', kwargs={'pk': str(self.user_b.id)})
        response = self.client.post(remove_url, {'team_id': str(self.eng_team.id)}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(TeamMember.objects.filter(team=self.eng_team, user=self.user_b, is_active=False).exists())

    def test_remove_team_disallowed_if_last_team_in_org(self):
        # Bob should already be in default team only (via signals)
        # Attempt to remove from default team should fail
        remove_url = reverse('user-remove-team', kwargs={'pk': str(self.user_b.id)})
        response = self.client.post(remove_url, {'team_id': str(self.default_team.id)}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'User must be assigned to at least one team')
