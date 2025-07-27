from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configuration des ViewSets
router = DefaultRouter()
router.register(r'pays', views.PaysViewSet, basename='pays')
router.register(r'lieux', views.LieuViewSet, basename='lieu')
router.register(r'voyages', views.VoyageViewSet, basename='voyage')
router.register(r'favoris', views.FavoriViewSet, basename='favori')

urlpatterns = [
    # Endpoints d'authentification
    path('ping/', views.ping, name='ping'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    
    # Endpoints des ViewSets
    path('', include(router.urls)),
    
    # Endpoints personnalisés
    path('profile/', views.UserProfileView.as_view(), name='user-profile'),
    path('lieux/<uuid:lieu_id>/detail/', views.LieuDetailView.as_view(), name='lieu-detail'),
    path('search/', views.SearchView.as_view(), name='search'),
] 