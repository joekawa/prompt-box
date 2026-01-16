from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AuthViewSet, OrganizationViewSet, TeamViewSet,
    PromptViewSet, CategoryViewSet, UserViewSet, FolderViewSet
)

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'organizations', OrganizationViewSet)
router.register(r'teams', TeamViewSet)
router.register(r'prompts', PromptViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'folders', FolderViewSet)
router.register(r'users', UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
