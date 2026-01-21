from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Organization, OrganizationMember, Team, TeamMember

@receiver(post_save, sender=Organization)
def create_default_team(sender, instance, created, **kwargs):
    if created:
        Team.objects.create(
            organization=instance,
            name=instance.name,
            description=f"Default team for {instance.name}"
        )

@receiver(post_save, sender=OrganizationMember)
def add_member_to_default_team(sender, instance, created, **kwargs):
    if created:
        # Find the default team - assuming it has the same name as the organization
        # based on Business Rule 1.
        default_team = Team.objects.filter(
            organization=instance.organization,
            name=instance.organization.name
        ).first()

        if default_team:
            # Check if already a member (to avoid duplicates if logic runs elsewhere)
            if not TeamMember.objects.filter(team=default_team, user=instance.user).exists():
                TeamMember.objects.create(
                    team=default_team,
                    user=instance.user,
                    role=instance.role # Inherit role or default to something?
                    # The rule doesn't specify role. Inheriting org role seems reasonable or just 'MEMBER'.
                    # But OrganizationMember role might be different from TeamMember role choices.
                    # OrganizationMember role is charfield, TeamMember role is charfield.
                    # Let's use the same role for now, or 'MEMBER'.
                    # Usually default team implies general access. Let's use 'MEMBER' to be safe unless they are ADMIN.
                )
