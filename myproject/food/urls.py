# backend/food/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.food_list, name='food_list'),
    path('<uuid:food_id>/', views.food_detail, name='food_detail'),  # Будет /food/{id}/
    
    # API endpoints - они должны быть отдельно
    path('api/categories/', views.get_categories, name='food_categories'),
    path('api/search/', views.search_food, name='search_food'),
    path('api/filter/', views.filter_food, name='filter_food'),
    path('api/add-review/', views.add_review, name='add_review'),
   path('ai-chat/', views.ai_chat, name='ai_chat'),
    path('api/ai-recommendation/', views.ai_get_recommendation, name='ai_get_recommendation'),
    path('api/ai-chat-message/', views.ai_chat_message, name='ai_chat_message'),
    path('api/ai-chat-session/<uuid:session_id>/', views.ai_chat_session, name='ai_chat_session'),
    
    # Для поддержки существующего фронтенда
    path('api/chat/', views.ai_chat_message, name='ai_chat_api'),  # Прокси для Groq AP
    
]