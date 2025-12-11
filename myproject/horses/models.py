from django.db import models
from django.contrib.auth.models import User
from user_profile.models import UserProfile
import uuid
from decimal import Decimal
from datetime import datetime, timedelta

class Horse(models.Model):
    BREED_CHOICES = [
        ('arabian', 'Арабская скаковая'),
        ('orlov', 'Орловский рысак'),
        ('trakehner', 'Тракененская'),
        ('don', 'Донская'),
        ('budyonny', 'Будённовская'),
    ]
    
    LEVEL_CHOICES = [
        ('beginner', 'Начинающий'),
        ('intermediate', 'Средний'),
        ('advanced', 'Продвинутый'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='Имя лошади')
    breed = models.CharField(max_length=50, choices=BREED_CHOICES, verbose_name='Порода')
    age = models.PositiveIntegerField(verbose_name='Возраст (лет)')
    color = models.CharField(max_length=50, verbose_name='Масть')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, verbose_name='Уровень подготовки')
    
    base_price_hour = models.DecimalField(max_digits=10, decimal_places=2, 
                                         verbose_name='Базовая цена за час', default=Decimal('2000.00'))
    premium_price_hour = models.DecimalField(max_digits=10, decimal_places=2, 
                                           verbose_name='Цена за час для Premium', default=Decimal('1700.00'))
    pro_price_hour = models.DecimalField(max_digits=10, decimal_places=2, 
                                        verbose_name='Цена за час для Pro', default=Decimal('1500.00'))
    
    description = models.TextField(verbose_name='Описание', blank=True)
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    is_available = models.BooleanField(default=True, verbose_name='Доступна для брони')
    image = models.ImageField(upload_to='horses/', null=True, blank=True, verbose_name='Фотография')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Лошадь'
        verbose_name_plural = 'Лошади'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.get_breed_display()})"
    
    def get_price_for_user(self, user):
        if hasattr(user, 'profile'):
            if user.profile.subscription == 'pro' and user.profile.subscription_active:
                return self.pro_price_hour
            elif user.profile.subscription == 'premium' and user.profile.subscription_active:
                return self.premium_price_hour
        return self.base_price_hour


# УДАЛИТЬ этот класс Booking если он существует
# class Booking(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='horse_bookings')
#     # ... остальные поля ...


# ОСТАВИТЬ только этот класс HorseBooking
class HorseBooking(models.Model):
    """Модель бронирования лошади"""
    STATUS_CHOICES = [
        ('pending', 'Ожидает подтверждения'),
        ('confirmed', 'Подтверждено'),
        ('completed', 'Завершено'),
        ('cancelled', 'Отменено'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='horse_bookings')
    horse = models.ForeignKey(Horse, on_delete=models.CASCADE, related_name='bookings')
    
    booking_date = models.DateField(verbose_name='Дата бронирования')
    booking_time = models.TimeField(verbose_name='Время бронирования')
    duration_hours = models.PositiveIntegerField(default=1, verbose_name='Длительность (часы)')
    
    # Цены
    base_price_hour = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Базовая цена за час')
    user_price_hour = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена для пользователя за час')
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0, verbose_name='Скидка %')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Общая стоимость')
    
    # Информация о клиенте
    client_name = models.CharField(max_length=200, verbose_name='Имя клиента')
    client_phone = models.CharField(max_length=20, verbose_name='Телефон клиента')
    client_comment = models.TextField(blank=True, verbose_name='Комментарий')
    
    # Статус
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    is_paid = models.BooleanField(default=False, verbose_name='Оплачено')
    
    # Системные поля
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Бронирование лошади'
        verbose_name_plural = 'Бронирования лошадей'
        ordering = ['-booking_date', 'booking_time']
    
    def __str__(self):
        return f"Бронь #{self.id.hex[:8]} - {self.horse.name} ({self.booking_date})"
    
    def get_display_status(self):
        """Получить отображаемый статус"""
        return dict(self.STATUS_CHOICES).get(self.status, self.status)
    
    def get_status_class(self):
        """Получить CSS класс для статуса"""
        status_classes = {
            'pending': 'status-pending',
            'confirmed': 'status-confirmed',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled',
        }
        return status_classes.get(self.status, 'status-pending')
    
    def calculate_price(self, user):
        """Рассчитать цену с учетом подписки пользователя"""
        base_price = self.horse.base_price_hour
        
        if user.is_authenticated and hasattr(user, 'profile'):
            user_price = self.horse.get_price_for_user(user)
            discount = ((base_price - user_price) / base_price) * 100
            total = user_price * self.duration_hours
        else:
            user_price = base_price
            discount = 0
            total = base_price * self.duration_hours
        
        return {
            'base_price': base_price,
            'user_price': user_price,
            'discount_percent': discount,
            'total': total
        }