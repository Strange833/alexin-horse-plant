# backend/food/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import FoodCategory, FoodItem, FoodReview, Recommendation, ConsultationHistory, AIChatSession, AIChatMessage

# Простейшая админка для категорий кормов
class FoodCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'order', 'is_active']
    list_editable = ['order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name']
    ordering = ['order']

# Простейшая админка для товаров (кормов)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ['image_preview', 'name', 'category', 'base_price', 'stock', 'is_active']
    list_filter = ['category', 'is_active', 'is_featured']
    search_fields = ['name', 'description']
    list_editable = ['stock', 'is_active']
    ordering = ['name']
    
    # Простые поля для редактирования
    fields = [
        'name',
        'category',
        'image',
        'image_preview_large',
        'description',
        'base_price',
        'premium_price',
        'pro_price',
        'stock',
        'unit',
        'weight',
        'is_active',
        'is_featured',
        'is_best_seller',
        'is_new'
    ]
    
    readonly_fields = ['image_preview_large']
    
    # Метод для предпросмотра изображения в списке
    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" />',
                obj.image.url
            )
        return "Нет фото"
    image_preview.short_description = "Фото"
    
    # Метод для большого предпросмотра в форме редактирования
    def image_preview_large(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 300px; object-fit: contain; border-radius: 10px; border: 1px solid #ddd;" />',
                obj.image.url
            )
        return "Загрузите изображение, чтобы увидеть предпросмотр"
    image_preview_large.short_description = "Предпросмотр фото"

# Простая админка для отзывов
class FoodReviewAdmin(admin.ModelAdmin):
    list_display = ['food', 'user', 'rating', 'created_at', 'is_approved']
    list_filter = ['rating', 'is_approved', 'created_at']
    list_editable = ['is_approved']
    search_fields = ['food__name', 'user__username', 'comment']

# Простая админка для рекомендаций ИИ
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['breed', 'age', 'purpose', 'budget', 'created_at']
    list_filter = ['breed', 'purpose', 'budget']
    search_fields = ['breed', 'purpose', 'notes']

# Простая админка для истории консультаций
class ConsultationHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'horse_name', 'horse_breed', 'horse_age', 'consulted_at']
    list_filter = ['horse_breed', 'consulted_at']
    search_fields = ['user__username', 'horse_name']

# Простая админка для сессий чата
class AIChatSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'title']

# Простая админка для сообщений чата
class AIChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['content']

# Регистрация всех моделей с простыми админками
admin.site.register(FoodCategory, FoodCategoryAdmin)
admin.site.register(FoodItem, FoodItemAdmin)
admin.site.register(FoodReview, FoodReviewAdmin)
admin.site.register(Recommendation, RecommendationAdmin)
admin.site.register(ConsultationHistory, ConsultationHistoryAdmin)
admin.site.register(AIChatSession, AIChatSessionAdmin)
admin.site.register(AIChatMessage, AIChatMessageAdmin)