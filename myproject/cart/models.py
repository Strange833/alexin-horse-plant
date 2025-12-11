from django.db import models
from django.contrib.auth.models import User
from food.models import FoodItem
import uuid
from datetime import datetime
from decimal import Decimal

class Cart(models.Model):
    """Корзина пользователя для покупок"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, 
                               related_name='shopping_cart', verbose_name='Пользователь')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Корзина покупок'
        verbose_name_plural = 'Корзины покупок'
    
    def __str__(self):
        return f"Корзина {self.user.username}"
    
    @property
    def total_items(self):
        return self.items.count()
    
    @property
    def subtotal(self):
        return sum(item.total_price for item in self.items.all())
    
    def get_discount(self, subscription_type=None):
        if subscription_type:
            if subscription_type == 'pro':
                return self.subtotal * Decimal('0.20')  # Правильно: Decimal * Decimal
            elif subscription_type == 'premium':
                return self.subtotal * Decimal('0.10')   # Правильно: Decimal * Decimal
        return Decimal('0')
    
    def get_delivery_cost(self, delivery_method='courier', subscription_type=None):
        """Получить стоимость доставки с учетом подписки"""
        if subscription_type in ['premium', 'pro'] and self.subtotal >= 2000:
            # Бесплатная доставка для premium/pro при заказе от 2000₽
            return 0
        
        if delivery_method == 'pickup':
            return 0
        elif delivery_method == 'post':
            return 300
        else:  # courier
            return 500
    
    def get_assembly_cost(self):
        """Стоимость сборки товара"""
        try:
            subtotal = self.subtotal
            # Правильно: используем Decimal для операций
            assembly_cost = subtotal * Decimal('0.05')
            return max(assembly_cost, Decimal('100'))
        except:
            return Decimal('100')
class CartItem(models.Model):
    """Элемент корзины"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, 
                            related_name='items', verbose_name='Корзина')
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE, 
                            verbose_name='Товар')
    quantity = models.PositiveIntegerField(default=1, verbose_name='Количество')
    price_at_addition = models.DecimalField(max_digits=10, decimal_places=2, 
                                          verbose_name='Цена при добавлении')
    
    class Meta:
        verbose_name = 'Элемент корзины'
        verbose_name_plural = 'Элементы корзины'
        unique_together = ['cart', 'food']
    
    def __str__(self):
        return f"{self.food.name} x {self.quantity}"
    
    @property
    def total_price(self):
        return self.price_at_addition * self.quantity

class FoodOrder(models.Model):  # Изменили имя с Order на FoodOrder
    """Заказ пользователя на корма"""
    STATUS_CHOICES = [
        ('pending', 'В обработке'),
        ('confirmed', 'Подтвержден'),
        ('in_progress', 'В работе'),
        ('shipped', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменен'),
    ]
    
    PAYMENT_METHODS = [
        ('card', 'Банковская карта'),
        ('sbp', 'СБП'),
        ('applepay', 'Apple Pay'),
        ('googlepay', 'Google Pay'),
        ('cash', 'Наличные при получении'),
    ]
    
    DELIVERY_METHODS = [
        ('courier', 'Курьерская доставка'),
        ('pickup', 'Самовывоз'),
        ('post', 'Почта России'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, 
                            related_name='food_orders', verbose_name='Пользователь')  # Изменено related_name
    order_number = models.CharField(max_length=20, unique=True, 
                                   verbose_name='Номер заказа')
    
    # Контактная информация
    customer_name = models.CharField(max_length=200, verbose_name='ФИО')
    customer_phone = models.CharField(max_length=20, verbose_name='Телефон')
    customer_email = models.EmailField(blank=True, verbose_name='Email')
    
    # Адрес доставки
    delivery_city = models.CharField(max_length=100, verbose_name='Город')
    delivery_street = models.CharField(max_length=200, verbose_name='Улица')
    delivery_house = models.CharField(max_length=20, verbose_name='Дом')
    delivery_apartment = models.CharField(max_length=20, blank=True, verbose_name='Квартира')
    delivery_index = models.CharField(max_length=10, blank=True, verbose_name='Индекс')
    
    # Способ доставки и оплаты
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHODS, 
                                      default='courier', verbose_name='Способ доставки')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, 
                                     default='card', verbose_name='Способ оплаты')
    
    # Финансовая информация
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, 
                                  verbose_name='Сумма товаров')
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0,
                                  verbose_name='Скидка')
    delivery_cost = models.DecimalField(max_digits=10, decimal_places=2,
                                       verbose_name='Стоимость доставки')
    assembly_cost = models.DecimalField(max_digits=10, decimal_places=2,
                                       verbose_name='Стоимость сборки')
    total = models.DecimalField(max_digits=10, decimal_places=2,
                               verbose_name='Итоговая сумма')
    
    # Статус и метаданные
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, 
                             default='pending', verbose_name='Статус')
    payment_status = models.BooleanField(default=False, verbose_name='Оплачено')
    promo_code = models.CharField(max_length=50, blank=True, verbose_name='Промокод')
    notes = models.TextField(blank=True, verbose_name='Примечания')
    
    # Связь с подпиской
    subscription_applied = models.CharField(max_length=20, blank=True, 
                                          verbose_name='Примененная подписка')
    subscription_savings = models.DecimalField(max_digits=10, decimal_places=2, 
                                              default=0, verbose_name='Экономия по подписке')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Заказ кормов'
        verbose_name_plural = 'Заказы кормов'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Заказ #{self.order_number} - {self.user.username}"

class FoodOrderItem(models.Model):  # Изменили имя с OrderItem на FoodOrderItem
    """Элемент заказа кормов"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(FoodOrder, on_delete=models.CASCADE, 
                             related_name='items', verbose_name='Заказ')
    food = models.ForeignKey(FoodItem, on_delete=models.PROTECT, 
                            verbose_name='Товар')
    quantity = models.PositiveIntegerField(verbose_name='Количество')
    price = models.DecimalField(max_digits=10, decimal_places=2, 
                               verbose_name='Цена за единицу')
    
    class Meta:
        verbose_name = 'Элемент заказа кормов'
        verbose_name_plural = 'Элементы заказа кормов'
    
    def __str__(self):
        return f"{self.food.name} x {self.quantity}"
    
    @property
    def total_price(self):
        return self.price * self.quantity