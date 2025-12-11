from django.urls import path
from . import views

urlpatterns = [
    path('', views.horses_list, name='horses_list'),
    path('book/<uuid:horse_id>/', views.book_horse, name='book_horse'),
    path('horse-details/<uuid:horse_id>/', views.get_horse_details, name='get_horse_details'),
    path('available-dates/', views.get_available_dates, name='get_available_dates'),
    path('available-times/<str:date_str>/', views.get_available_times, name='get_available_times'),
    path('create-booking/', views.create_booking, name='create_booking'),
    path('my-bookings/', views.get_user_bookings, name='get_user_bookings'),
    path('cancel-booking/<uuid:booking_id>/', views.cancel_booking, name='cancel_booking'),
    path('check-availability/', views.check_booking_availability, name='check_booking_availability'),
    path('booking-stats/', views.get_user_booking_stats, name='get_user_booking_stats'),
    path('api/user-bookings/', views.get_user_bookings_api, name='get_user_bookings_api'),  # НОВЫЙ URL
]