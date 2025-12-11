from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid

class UserProfile(models.Model):
    """Расширенная модель профиля пользователя"""
    
    SUBSCRIPTION_CHOICES = [
        ('free', 'Любитель'),
        ('premium', 'Конник'),
        ('pro', 'Спортсмен'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    subscription = models.CharField(max_length=20, choices=SUBSCRIPTION_CHOICES, default='free')
    subscription_active = models.BooleanField(default=False)
    subscription_start = models.DateField(null=True, blank=True)
    subscription_end = models.DateField(null=True, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Профиль {self.user.username}"
    
    def get_full_name(self):
        """Получить полное имя пользователя"""
        if self.user.first_name and self.user.last_name:
            return f"{self.user.first_name} {self.user.last_name}"
        return self.user.username
    
    def get_subscription_display_name(self):
        """Получить отображаемое имя подписки"""
        return dict(self.SUBSCRIPTION_CHOICES).get(self.subscription, 'Любитель')
    
    def is_premium(self):
        """Проверка, есть ли премиум подписка"""
        return self.subscription in ['premium', 'pro'] and self.subscription_active

class Horse(models.Model):
    """Модель лошади пользователя"""
    
    BREED_CHOICES = [
        ('ahaltekin', 'Ахалтекинская'),
        ('arab', 'Арабская'),
        ('orlov', 'Орловский рысак'),
        ('trakenen', 'Тракененская'),
        ('budyonny', 'Будённовская'),
        ('don', 'Донская'),
        ('tinker', 'Цыганская (тинкер)'),
        ('other', 'Другая порода'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='horses')
    name = models.CharField(max_length=100, verbose_name='Имя лошади')
    breed = models.CharField(max_length=50, choices=BREED_CHOICES, verbose_name='Порода')
    age = models.PositiveIntegerField(verbose_name='Возраст (лет)')
    color = models.CharField(max_length=50, verbose_name='Масть', blank=True)
    description = models.TextField(verbose_name='Описание', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_breed_display()})"
    
    class Meta:
        verbose_name = 'Лошадь'
        verbose_name_plural = 'Лошади'
        ordering = ['name']


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Создать профиль пользователя при создании пользователя"""
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Сохранить профиль пользователя"""
    instance.profile.save()