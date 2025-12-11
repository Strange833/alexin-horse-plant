# backend/horses/admin.py
from django.contrib import admin
from .models import Horse, HorseBooking

# Простейшая админка для лошадей
class HorseAdmin(admin.ModelAdmin):
    list_display = ('name', 'breed', 'age', 'color', 'is_active')
    list_filter = ('breed', 'is_active')
    search_fields = ('name', 'breed')
    fields = ('name', 'breed', 'age', 'color', 'level', 'description', 'image')

# Простейшая админка для бронирований
class HorseBookingAdmin(admin.ModelAdmin):
    list_display = ('horse', 'client_name', 'booking_date', 'status')
    list_filter = ('status', 'booking_date')

admin.site.register(Horse, HorseAdmin)
admin.site.register(HorseBooking, HorseBookingAdmin)