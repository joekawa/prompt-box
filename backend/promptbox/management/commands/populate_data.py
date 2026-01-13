from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from promptbox.models import (
    Organization, OrganizationMember, Team, TeamMember,
    Category, Prompt, TeamPrompt, PromptCategory
)
import uuid

User = get_user_model()

class Command(BaseCommand):
    help = 'Populates the database with sample data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write('Deleting old data...')
        # Clean up old data to avoid duplicates if run multiple times
        # Be careful with dependency deletion order
        TeamPrompt.objects.all().delete()
        PromptCategory.objects.all().delete()
        Prompt.objects.all().delete()
        Category.objects.all().delete()
        TeamMember.objects.all().delete()
        Team.objects.all().delete()
        OrganizationMember.objects.all().delete()
        Organization.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        self.stdout.write('Creating test data...')

        # 1. Create Users
        admin_user = User.objects.create_user(email='admin@acme.com', password='password123', name='Alice Admin')
        dev_user = User.objects.create_user(email='dev@acme.com', password='password123', name='Bob Developer')
        marketing_user = User.objects.create_user(email='marketing@acme.com', password='password123', name='Charlie Marketer')

        # 2. Create Organization
        acme_org = Organization.objects.create(name='Acme Corp', description='The Coyote Catchers')

        # 3. Add Members to Organization
        OrganizationMember.objects.create(organization=acme_org, user=admin_user, role='ADMIN')
        OrganizationMember.objects.create(organization=acme_org, user=dev_user, role='MEMBER')
        OrganizationMember.objects.create(organization=acme_org, user=marketing_user, role='MEMBER')

        # 4. Create Teams
        eng_team = Team.objects.create(organization=acme_org, name='Engineering', description='Software Engineering Team')
        mkt_team = Team.objects.create(organization=acme_org, name='Marketing', description='Marketing & Sales')

        # 5. Add Users to Teams
        TeamMember.objects.create(team=eng_team, user=dev_user, role='MEMBER')
        TeamMember.objects.create(team=mkt_team, user=marketing_user, role='MEMBER')
        # Admin is in both
        TeamMember.objects.create(team=eng_team, user=admin_user, role='OWNER')
        TeamMember.objects.create(team=mkt_team, user=admin_user, role='OWNER')

        # 6. Create Categories
        code_cat = Category.objects.create(organization=acme_org, name='Coding', description='Code generation prompts')
        email_cat = Category.objects.create(organization=acme_org, name='Email', description='Email templates')

        # 7. Create Prompts
        # Prompt 1: Coding (Shared with Engineering)
        prompt1 = Prompt.objects.create(
            organization=acme_org,
            created_by=dev_user,
            name='Python API Boilerplate',
            description='Generates a basic Django API view',
            prompt='Create a Django ViewSet for model X...',
            model='gpt-4'
        )
        PromptCategory.objects.create(prompt=prompt1, category=code_cat)
        TeamPrompt.objects.create(team=eng_team, prompt=prompt1)

        # Prompt 2: Marketing (Shared with Marketing)
        prompt2 = Prompt.objects.create(
            organization=acme_org,
            created_by=marketing_user,
            name='Cold Email Generator',
            description='Generate sales outreach emails',
            prompt='Write a cold email to a CTO about...',
            model='gpt-3.5-turbo'
        )
        PromptCategory.objects.create(prompt=prompt2, category=email_cat)
        TeamPrompt.objects.create(team=mkt_team, prompt=prompt2)

        # Prompt 3: General (Private to Admin initially)
        prompt3 = Prompt.objects.create(
            organization=acme_org,
            created_by=admin_user,
            name='Q3 Strategy Draft',
            description='Drafting the strategy doc',
            prompt='Outline the key objectives for Q3...',
            model='gpt-4'
        )
        # Not shared with any team yet

        self.stdout.write(self.style.SUCCESS('Successfully populated sample data'))
        self.stdout.write(self.style.SUCCESS('Users created:'))
        self.stdout.write(self.style.SUCCESS('  - admin@acme.com / password123'))
        self.stdout.write(self.style.SUCCESS('  - dev@acme.com / password123'))
        self.stdout.write(self.style.SUCCESS('  - marketing@acme.com / password123'))
