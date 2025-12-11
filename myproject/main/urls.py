# main/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),  # Главная страница
    path('api/register/', views.register_view, name='register'),
    path('api/login/', views.login_view, name='login'),
    path('api/logout/', views.logout_view, name='logout'),
    path('api/user-info/', views.get_user_info, name='user_info'),
    path('api/select-subscription/', views.select_subscription, name='select_subscription'),
]