from django.db import models
from django.contrib.auth.models import User
import uuid
from decimal import Decimal
from django.utils import timezone

class FoodCategory(models.Model):
    """Категория корма"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='Название категории')
    description = models.TextField(blank=True, verbose_name='Описание')
    icon = models.CharField(max_length=50, default='🥕', verbose_name='Иконка')
    order = models.IntegerField(default=0, verbose_name='Порядок')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True)
    
    manufacturer = models.CharField(max_length=200, verbose_name='Производитель', default='ООО "Конный корм"')
    production_location = models.CharField(max_length=300, verbose_name='Место производства', default='г. Москва')
    expiration_months = models.IntegerField(verbose_name='Срок годности (месяцев)', default=12)
    storage_conditions = models.TextField(verbose_name='Условия хранения', default='В сухом помещении')
    quality_certificates = models.CharField(max_length=300, verbose_name='Сертификаты качества', default='ГОСТ')
    
    # Состав и пищевая ценность
    composition = models.TextField(verbose_name='Состав', default='Овёс очищенный 100%')
    protein_percent = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Протеин (%)', default=14.00)
    fat_percent = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Жиры (%)', default=4.00)
    fiber_percent = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Клетчатка (%)', default=8.00)
    calcium_percent = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Кальций (%)', default=0.80)
    phosphorus_percent = models.DecimalField(max_digits=5, decimal_places=2, verbose_name='Фосфор (%)', default=0.60)
    
    # Рекомендации
    recommendations = models.TextField(verbose_name='Рекомендации по кормлению', default='Давать согласно рекомендациям ветеринара')

    class Meta:
        verbose_name = 'Категория корма'
        verbose_name_plural = 'Категории кормов'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name

class FoodItem(models.Model):
    """Товар (корм для лошадей)"""
    
    UNIT_CHOICES = [
        ('kg', 'кг'),
        ('piece', 'шт.'),
        ('pack', 'упак.'),
        ('liter', 'л'),
        ('bag', 'мешок'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, verbose_name='Название', default='Новый товар')
    description = models.TextField(verbose_name='Описание', default='Описание товара')
    short_description = models.CharField(max_length=300, verbose_name='Краткое описание', blank=True)
    category = models.ForeignKey(FoodCategory, on_delete=models.SET_NULL, 
                                null=True, blank=True, related_name='items', verbose_name='Категория')
    
    base_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name='Базовая цена',
        default=Decimal('100.00')
    )
    premium_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name='Цена для Premium',
        default=Decimal('90.00')
    )
    pro_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name='Цена для Pro',
        default=Decimal('80.00')
    )
    
    unit = models.CharField(
        max_length=10, 
        choices=UNIT_CHOICES, 
        default='kg', 
        verbose_name='Единица измерения'
    )
    weight = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        verbose_name='Вес/объем',
        default=Decimal('1.00')
    )
    calories = models.IntegerField(default=0, verbose_name='Ккал на 100г')
    protein = models.DecimalField(
        max_digits=5, 
        decimal_places=1, 
        default=Decimal('0.0'), 
        verbose_name='Белки %'
    )
    fat = models.DecimalField(
        max_digits=5, 
        decimal_places=1, 
        default=Decimal('0.0'), 
        verbose_name='Жиры %'
    )
    fiber = models.DecimalField(
        max_digits=5, 
        decimal_places=1, 
        default=Decimal('0.0'), 
        verbose_name='Клетчатка %'
    )
    
    image = models.ImageField(
        upload_to='food_images/', 
        null=True, 
        blank=True, 
        verbose_name='Изображение'
    )
    
    stock = models.IntegerField(default=0, verbose_name='Количество на складе')
    min_order = models.IntegerField(default=1, verbose_name='Минимальный заказ')
    max_order = models.IntegerField(default=100, verbose_name='Максимальный заказ')
    
    is_featured = models.BooleanField(default=False, verbose_name='Рекомендуемый')
    is_best_seller = models.BooleanField(default=False, verbose_name='Хит продаж')
    is_new = models.BooleanField(default=True, verbose_name='Новинка')
    
    rating = models.DecimalField(
        max_digits=3, 
        decimal_places=2, 
        default=Decimal('0.00'), 
        verbose_name='Рейтинг'
    )
    review_count = models.IntegerField(default=0, verbose_name='Количество отзывов')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    
    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def get_price_for_user(self, user):
        """Получить цену в зависимости от подписки пользователя"""
        try:
            profile = user.profile
            if profile.subscription == 'pro' and profile.subscription_active:
                return self.pro_price
            elif profile.subscription == 'premium' and profile.subscription_active:
                return self.premium_price
            else:
                return self.base_price
        except:
            return self.base_price
    
    def get_display_price(self):
        """Отображаемая цена"""
        if self.pro_price < self.base_price:
            return self.pro_price
        elif self.premium_price < self.base_price:
            return self.premium_price
        else:
            return self.base_price
    
    def get_discount_percentage(self):
        """Процент скидки от базовой цены"""
        if self.pro_price < self.base_price:
            return int((1 - self.pro_price / self.base_price) * 100)
        return 0
    def get_discount_percent(self):
        """Получить процент скидки для подписчиков"""
        if self.base_price > 0:
            discount = ((self.base_price - self.premium_price) / self.base_price) * 100
            return int(discount)
        return 0
    
    def get_price_for_user(self, user):
        """Получить цену в зависимости от подписки"""
        try:
            profile = user.profile
            if profile.subscription == 'pro' and profile.subscription_active:
                return self.pro_price
            elif profile.subscription == 'premium' and profile.subscription_active:
                return self.premium_price
            else:
                return self.base_price
        except:
            return self.base_price
    @property
    def is_in_stock(self):
        return self.stock > 0
    
    @property
    def is_low_stock(self):
        return 0 < self.stock <= 10

class FoodReview(models.Model):
    """Отзыв о товаре"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    food = models.ForeignKey(FoodItem, on_delete=models.CASCADE, 
                            related_name='reviews', verbose_name='Товар')
    user = models.ForeignKey(User, on_delete=models.CASCADE, 
                            verbose_name='Пользователь')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], 
                                verbose_name='Оценка', default=5)
    comment = models.TextField(verbose_name='Комментарий', default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=True, verbose_name='Одобрен')
    
    class Meta:
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        ordering = ['-created_at']
        unique_together = ['food', 'user']
    
    def __str__(self):
        return f"Отзыв от {self.user.username} на {self.food.name}"
class AIChatSession(models.Model):
    """Сессия чата с ИИ"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, 
                           related_name='ai_chat_sessions', verbose_name="Пользователь")
    title = models.CharField(max_length=200, verbose_name="Название сессии", default="Консультация")
    horse_data = models.JSONField(default=dict, verbose_name="Данные о лошади")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Сессия чата с ИИ'
        verbose_name_plural = 'Сессии чата с ИИ'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Чат {self.user.username} - {self.created_at.strftime('%d.%m.%Y')}"


class AIChatMessage(models.Model):
    """Сообщение в чате с ИИ"""
    ROLE_CHOICES = [
        ('system', 'Система'),
        ('user', 'Пользователь'),
        ('assistant', 'ИИ'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(AIChatSession, on_delete=models.CASCADE, 
                              related_name='messages', verbose_name="Сессия")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name="Роль")
    content = models.TextField(verbose_name="Содержание")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.get_role_display()} - {self.created_at.strftime('%H:%M')}"
class Recommendation(models.Model):
    """Рекомендация ИИ-консультанта"""
    
    BREED_CHOICES = [
        ('arabian', 'Арабская скаковая'),
        ('orlov', 'Орловский рысак'),
        ('trakehner', 'Тракененская'),
        ('don', 'Донская'),
        ('budyonny', 'Будённовская'),
        ('friesian', 'Фризская'),
        ('hannover', 'Ганноверская'),
        ('akhalteke', 'Ахалтекинская'),
        ('other', 'Другая'),
    ]
    
    PURPOSE_CHOICES = [
        ('sport', 'Спорт'),
        ('walk', 'Прогулки'),
        ('foal', 'Выращивание жеребёнка'),
        ('rehabilitation', 'Реабилитация'),
        ('breeding', 'Племенное разведение'),
        ('show', 'Выставки'),
    ]
    
    BUDGET_CHOICES = [
        ('economy', 'Экономный'),
        ('standard', 'Стандартный'),
        ('premium', 'Премиум'),
        ('professional', 'Профессиональный'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Параметры консультации
    breed = models.CharField(max_length=50, choices=BREED_CHOICES, verbose_name="Порода")
    age = models.IntegerField(verbose_name="Возраст (лет)")
    weight = models.IntegerField(verbose_name="Вес (кг)")
    purpose = models.CharField(max_length=50, choices=PURPOSE_CHOICES, verbose_name="Цель содержания")
    budget = models.CharField(max_length=20, choices=BUDGET_CHOICES, verbose_name="Бюджет")
    activity_level = models.CharField(max_length=20, 
                                     choices=[('low', 'Низкая'), ('medium', 'Средняя'), ('high', 'Высокая')],
                                     verbose_name="Уровень активности")
    
    # Рекомендации ИИ
    food_type = models.CharField(max_length=200, verbose_name="Тип корма", default="Сбалансированный корм")
    daily_norm = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="Суточная норма (кг)", default=Decimal('0.00'))
    feeding_frequency = models.IntegerField(verbose_name="Частота кормления (раз/день)", default=3)
    
    # Рассчитанные даты
    next_purchase_date = models.DateField(verbose_name="Дата следующей закупки", null=True, blank=True)
    next_vet_check = models.DateField(verbose_name="Дата следующего ветосмотра", null=True, blank=True)
    
    # Связанные товары (JSON поле для хранения ID рекомендованных товаров)
    recommended_products = models.JSONField(default=list, verbose_name="Рекомендованные товары")
    
    # Общая информация
    notes = models.TextField(verbose_name="Дополнительные рекомендации", blank=True, default="")
    total_monthly_cost = models.DecimalField(max_digits=10, decimal_places=2, 
                                           verbose_name="Общая месячная стоимость", default=Decimal('0.00'))
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Рекомендация ИИ'
        verbose_name_plural = 'Рекомендации ИИ'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Рекомендация для {self.get_breed_display()} ({self.get_purpose_display()})"
    
    def get_recommended_food_items(self):
        """Получить рекомендованные товары"""
        try:
            from .models import FoodItem
            valid_ids = []
            for pid in self.recommended_products:
                try:
                    valid_ids.append(uuid.UUID(pid))
                except ValueError:
                    continue
            return FoodItem.objects.filter(id__in=valid_ids)
        except ImportError:
            return FoodItem.objects.none()
    
    def calculate_monthly_cost(self):
        """Рассчитать месячную стоимость"""
        try:
            items = self.get_recommended_food_items()
            monthly_cost = Decimal('0')
            for item in items:
                # Примерная логика расчета
                daily_cost = item.base_price * self.daily_norm
                monthly_cost += daily_cost * Decimal('30')
            return monthly_cost
        except:
            return Decimal('0')
class ConsultationHistory(models.Model):
    """История консультаций пользователя"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, 
                           related_name='consultations', verbose_name="Пользователь")
    recommendation = models.ForeignKey(Recommendation, on_delete=models.CASCADE,
                                     verbose_name="Рекомендация")
    
    # Пользовательские данные (могут отличаться от Horse)
    horse_name = models.CharField(max_length=100, verbose_name="Кличка лошади", default="Не указано")
    horse_breed = models.CharField(max_length=50, verbose_name="Порода", default="other")
    horse_age = models.IntegerField(verbose_name="Возраст", default=0)
    horse_weight = models.IntegerField(verbose_name="Вес (кг)", default=0)
    
    # Счетчик
    products_added_to_cart = models.IntegerField(default=0, verbose_name="Товаров добавлено в корзину")
    is_followed = models.BooleanField(default=False, verbose_name="Следовал рекомендациям")
    
    consulted_at = models.DateTimeField(auto_now_add=True)
    last_reminder = models.DateTimeField(null=True, blank=True, verbose_name="Последнее напоминание")
    
    class Meta:
        verbose_name = 'История консультаций'
        verbose_name_plural = 'История консультаций'
        ordering = ['-consulted_at']
    
    def __str__(self):
        return f"Консультация {self.user.username} - {self.consulted_at.strftime('%d.%m.%Y')}"
    
    def days_since_consultation(self):
        """Дней с момента консультации"""
        from django.utils import timezone
        return (timezone.now() - self.consulted_at).days
    
    def should_send_reminder(self):
        """Нужно ли отправлять напоминание о закупке"""
        return self.days_since_consultation() >= 25  # Напоминать за 5 дней до месяца

class AIChatSession(models.Model):
    """Сессия чата с ИИ"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, 
                           related_name='ai_chat_sessions', verbose_name="Пользователь")
    title = models.CharField(max_length=200, verbose_name="Название сессии", default="Консультация")
    horse_data = models.JSONField(default=dict, verbose_name="Данные о лошади")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Сессия чата с ИИ'
        verbose_name_plural = 'Сессии чата с ИИ'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Чат {self.user.username} - {self.created_at.strftime('%d.%m.%Y')}"


class AIChatMessage(models.Model):
    """Сообщение в чате с ИИ"""
    ROLE_CHOICES = [
        ('system', 'Система'),
        ('user', 'Пользователь'),
        ('assistant', 'ИИ'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(AIChatSession, on_delete=models.CASCADE, 
                              related_name='messages', verbose_name="Сессия")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, verbose_name="Роль")
    content = models.TextField(verbose_name="Содержание")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.get_role_display()} - {self.created_at.strftime('%H:%M')}"