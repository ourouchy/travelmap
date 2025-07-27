from django.urls import path
from . import views

urlpatterns = [
    path('ping/', views.ping, name='ping'),
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
] 