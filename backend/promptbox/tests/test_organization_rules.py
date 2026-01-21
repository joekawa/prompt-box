from django.test import TestCase
from django.contrib.auth import get_user_model
from promptbox.models import Organization, OrganizationMember, Team, TeamMember

User = get_user_model()

class OrganizationBusinessRulesTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='password123', name='Test User')

    def test_organization_creation_creates_default_team(self):
        """
        Rule 1: When an organization is created, a default team is created with the name of the organization.
        """
        org_name = "Test Org"
        org = Organization.objects.create(name=org_name)

        # Check if team exists
        team_exists = Team.objects.filter(organization=org, name=org_name).exists()
        self.assertTrue(team_exists, "Default team matching organization name should be created.")

    def test_organization_member_added_to_default_team(self):
        """
        Rule 2: Each user that is a member of an organization is automatically a member of the default team.
        """
        org_name = "Member Org"
        org = Organization.objects.create(name=org_name)

        # Add user to organization
        OrganizationMember.objects.create(organization=org, user=self.user, role='MEMBER')

        # Get the default team
        default_team = Team.objects.get(organization=org, name=org_name)

        # Check if user is in the default team
        is_team_member = TeamMember.objects.filter(team=default_team, user=self.user).exists()
        self.assertTrue(is_team_member, "Organization member should be automatically added to the default team.")

