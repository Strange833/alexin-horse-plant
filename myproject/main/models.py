from django.db import models
from django.contrib.auth.models import User

class Subscription(models.Model):
    SUBSCRIPTION_TYPES = [
        ('free', 'Любитель'),
        ('premium', 'Конник'),
        ('pro', 'Спортсмен'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    subscription_type = models.CharField(max_length=20, choices=SUBSCRIPTION_TYPES, default='free')
    is_active = models.BooleanField(default=False)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_subscription_type_display()}"

# class Cart(models.Model):
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     def get_total_items(self):
#         return self.items.count()

class Contact(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    vk_url = models.URLField()
    
    def __str__(self):
        return self.name