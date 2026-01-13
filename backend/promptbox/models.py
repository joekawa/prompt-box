import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.base_user import BaseUserManager

class BaseModel(models.Model):
    """
    Abstract base model with UUID primary key and timestamps.
    Used for entities that require full auditing (created_at and updated_at).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class CustomUserManager(BaseUserManager):
    """
    Custom user manager where email is the unique identifiers
    for authentication instead of usernames.
    """
    def create_user(self, email, password, **extra_fields):
        """
        Create and save a User with the given email and password.
        """
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, **extra_fields):
        """
        Create and save a SuperUser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)

class Organization(BaseModel):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_trial = models.BooleanField(default=False)
    trial_start_date = models.DateTimeField(null=True, blank=True)
    trial_end_date = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Authentication is based on email, not username.
    """
    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    # is_active is inherited from AbstractUser
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    objects = CustomUserManager()

    def __str__(self):
        return self.email

class OrganizationMember(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organization_memberships')
    role = models.CharField(max_length=50) # e.g. 'ADMIN', 'MEMBER', 'VIEWER'

    def __str__(self):
        return f"{self.user.email} - {self.organization.name} ({self.role})"

class Team(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='teams')
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class TeamMember(BaseModel):
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='team_memberships')
    role = models.CharField(max_length=50) # e.g. 'OWNER', 'MEMBER', 'VIEWER'
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} - {self.team.name} ({self.role})"

class Category(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Prompt(BaseModel):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='prompts')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='prompts')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    prompt = models.TextField()
    model = models.CharField(max_length=255)
    visibility = models.CharField(
        max_length=20,
        choices=[('PRIVATE', 'Private'), ('TEAM', 'Team')],
        default='PRIVATE'
    )
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class TeamPrompt(models.Model):
    """
    Junction table for Team <-> Prompt (Access).
    Does not track updated_at, per diagram.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name='team_prompts')
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE, related_name='shared_teams')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.team.name} access to {self.prompt.name}"

class PromptCategory(models.Model):
    """
    Junction table for Prompt <-> Category (Classification).
    Does not track updated_at, per diagram.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    prompt = models.ForeignKey(Prompt, on_delete=models.CASCADE, related_name='prompt_categories')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='included_prompts')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.prompt.name} in {self.category.name}"
