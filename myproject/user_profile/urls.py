from django.urls import path
from . import views

urlpatterns = [
    path('', views.profile_view, name='profile'),
    path('api/update/', views.update_profile, name='update_profile'),
    path('api/subscription/', views.update_subscription, name='update_subscription'),
    path('api/data/', views.get_profile_data, name='profile_data'),
    path('api/add-horse/', views.add_horse, name='add_horse'),
    path('api/logout/', views.logout_view, name='logout'),
]