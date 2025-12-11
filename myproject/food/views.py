from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q, Avg
from .models import FoodCategory, FoodItem, FoodReview
import json
from django.views.decorators.http import require_GET
from .models import FoodItem, Recommendation, ConsultationHistory
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .services import IOIntelligenceService  # НОВЫЙ ИМПОРТ
from .models import AIChatSession, AIChatMessage, FoodItem
from decimal import Decimal
from datetime import timedelta
import datetime

from django.utils import timezone


@csrf_exempt
@login_required
def delete_all_sessions(request):
    """Удалить все сессии пользователя"""
    if request.method == 'DELETE':
        try:
            # Удаляем все сессии пользователя
            sessions_deleted = AIChatSession.objects.filter(user=request.user).delete()
            
            return JsonResponse({
                'success': True,
                'message': f'Удалено {sessions_deleted[0]} сессий',
                'deleted_count': sessions_deleted[0]
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Метод не разрешен'}, status=405)

@csrf_exempt
@login_required
def delete_old_sessions(request):
    """Удалить сессии старше 30 дней"""
    if request.method == 'DELETE':
        try:
            cutoff_date = timezone.now() - timedelta(days=30)
            old_sessions = AIChatSession.objects.filter(
                user=request.user,
                updated_at__lt=cutoff_date
            )
            
            deleted_ids = [str(session.id) for session in old_sessions]
            deleted_count = old_sessions.delete()[0]
            
            return JsonResponse({
                'success': True,
                'message': f'Удалено {deleted_count} старых сессий',
                'deleted_count': deleted_count,
                'deleted_sessions': deleted_ids
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Метод не разрешен'}, status=405)

@csrf_exempt
@login_required
def delete_session(request, session_id):
    """Удалить конкретную сессию"""
    if request.method == 'DELETE':
        try:
            session = AIChatSession.objects.get(id=session_id, user=request.user)
            session.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Сессия успешно удалена'
            })
        except AIChatSession.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Сессия не найдена'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Метод не разрешен'}, status=405)

@login_required
def sessions_list(request):
    """Получить список сессий для обновления UI"""
    sessions = AIChatSession.objects.filter(user=request.user).order_by('-updated_at')
    
    sessions_data = []
    for session in sessions:
        sessions_data.append({
            'id': str(session.id),
            'title': session.title,
            'created_at': session.created_at.strftime('%d.%m.%Y %H:%M'),
            'updated_at': session.updated_at.strftime('%d.%m.%Y %H:%M')
        })
    
    return JsonResponse({
        'success': True,
        'sessions': sessions_data
    })

@login_required
def ai_chat(request):
    """Страница чата с ИИ"""
    sessions = AIChatSession.objects.filter(user=request.user)
    recent_recommendations = Recommendation.objects.filter(
        consultationhistory__user=request.user
    ).order_by('-created_at')[:5]
    
    context = {
        'sessions': sessions,
        'recent_recommendations': recent_recommendations,
        'breed_choices': Recommendation.BREED_CHOICES,
        'purpose_choices': Recommendation.PURPOSE_CHOICES,
        'budget_choices': Recommendation.BUDGET_CHOICES,
    }
    
    return render(request, 'food/ai_chat.html', context)

@csrf_exempt
@login_required
def ai_get_recommendation(request):
    """Получить рекомендацию от ИИ"""
    if request.method == 'POST':
        try:
            # Пытаемся прочитать JSON данные
            try:
                data = json.loads(request.body)
            except json.JSONDecodeError as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Неверный JSON формат: {str(e)}'
                }, status=400)
            
            # Получаем данные из запроса с проверкой
            breed = data.get('breed')
            age_str = data.get('age', '0')
            weight_str = data.get('weight', '0')
            purpose = data.get('purpose')
            budget = data.get('budget')
            activity_level = data.get('activity_level', 'medium')
            
            # Конвертируем в числа с обработкой ошибок
            try:
                age = int(age_str)
                weight = int(weight_str)
            except ValueError:
                return JsonResponse({
                    'success': False,
                    'message': 'Возраст и вес должны быть числами'
                }, status=400)
            
            # Валидация
            if not breed:
                return JsonResponse({
                    'success': False,
                    'message': 'Порода не указана'
                }, status=400)
            
            if not purpose:
                return JsonResponse({
                    'success': False,
                    'message': 'Цель содержания не указана'
                }, status=400)
            
            if not budget:
                return JsonResponse({
                    'success': False,
                    'message': 'Бюджет не указан'
                }, status=400)
            
            if age <= 0:
                return JsonResponse({
                    'success': False,
                    'message': 'Возраст должен быть положительным числом'
                }, status=400)
            
            if weight <= 0:
                return JsonResponse({
                    'success': False,
                    'message': 'Вес должен быть положительным числом'
                }, status=400)
            
            # ЗАМЕНА: Используем IOIntelligenceService вместо GroqAIService
            ai_service = IOIntelligenceService()
            
            # Получаем рекомендацию
            ai_response = ai_service.get_food_recommendation(
                breed=breed,
                age=age,
                weight=weight,
                purpose=purpose,
                budget=budget,
                activity_level=activity_level
            )
            
            if not ai_response:
                return JsonResponse({
                    'success': False,
                    'message': 'Не удалось получить ответ от ИИ'
                }, status=500)
            
            # Создаем сессию чата
            from django.utils import timezone
            session = AIChatSession.objects.create(
                user=request.user,
                title=f"Консультация {timezone.now().strftime('%d.%m.%Y')}",
                horse_data={
                    'breed': breed,
                    'age': age,
                    'weight': weight,
                    'purpose': purpose,
                    'budget': budget,
                    'activity_level': activity_level
                }
            )
            
            # Сохраняем сообщения
            AIChatMessage.objects.create(
                session=session,
                role='user',
                content=f"Рекомендация для лошади: порода {breed}, возраст {age} лет, вес {weight} кг, цель {purpose}, бюджет {budget} руб"
            )
            
            AIChatMessage.objects.create(
                session=session,
                role='assistant',
                content=ai_response
            )
            
            # Находим рекомендованные товары
            food_items = FoodItem.objects.filter(is_active=True)
            recommended_products = ai_service.analyze_and_extract_products(ai_response, food_items)
            
            # Конвертируем budget в Decimal
            try:
                budget_decimal = Decimal(str(budget))
            except:
                budget_decimal = Decimal('0')
            
            # Создаем рекомендацию в базе данных
            recommendation = Recommendation.objects.create(
                breed=breed,
                age=age,
                weight=weight,
                purpose=purpose,
                budget=budget,
                activity_level=activity_level,
                food_type="Рекомендовано ИИ",
                daily_norm=Decimal('0.0'),
                feeding_frequency=3,
                next_purchase_date=timezone.now().date() + timedelta(days=30),
                next_vet_check=timezone.now().date() + timedelta(days=180),
                recommended_products=[str(pid) for pid in recommended_products],
                notes=ai_response,
                total_monthly_cost=budget_decimal
            )
            
            # Сохраняем в историю
            consultation = ConsultationHistory.objects.create(
                user=request.user,
                recommendation=recommendation,
                horse_name="Лошадь из чата",
                horse_breed=breed,
                horse_age=age,
                horse_weight=weight
            )
            
            return JsonResponse({
                'success': True,
                'response': ai_response,
                'recommended_products': [str(pid) for pid in recommended_products],
                'session_id': str(session.id),
                'recommendation_id': str(recommendation.id)
            })
            
        except Exception as e:
            # Логируем полную ошибку
            import traceback
            print(f"Error in ai_get_recommendation: {str(e)}")
            print(traceback.format_exc())
            
            return JsonResponse({
                'success': False,
                'message': f'Внутренняя ошибка сервера: {str(e)}'
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Недопустимый метод'}, status=405)

@csrf_exempt
@login_required
def ai_chat_message(request):
    """Отправить сообщение в чат с ИИ"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            message = data.get('message')
            session_id = data.get('session_id')
            
            if not message:
                return JsonResponse({
                    'success': False,
                    'message': 'Сообщение не может быть пустым'
                }, status=400)
            
            # Получаем сессию
            session = AIChatSession.objects.get(id=session_id, user=request.user)
            
            # Сохраняем сообщение пользователя
            user_message = AIChatMessage.objects.create(
                session=session,
                role='user',
                content=message
            )
            
            # Получаем историю чата
            chat_history = list(session.messages.all().order_by('created_at'))
            
            # Конвертируем в формат для API
            messages_for_api = []
            for msg in chat_history[-10:]:  # Берем последние 10 сообщений
                messages_for_api.append({
                    'role': msg.role,
                    'content': msg.content
                })
            
            # ЗАМЕНА: Используем IOIntelligenceService для чата
            ai_service = IOIntelligenceService()
            
            # Создаем промпт для чата
            chat_prompt = f"""Продолжи диалог о кормлении лошадей. 
            Предыдущие сообщения: {json.dumps(messages_for_api[-5:])}
            Текущий вопрос пользователя: {message}
            
            Ответь как эксперт по кормлению лошадей."""
            
            # Получаем ответ от ИИ
            ai_response = ai_service.get_food_recommendation(
                breed=session.horse_data.get('breed', 'other'),
                age=session.horse_data.get('age', 5),
                weight=session.horse_data.get('weight', 400),
                purpose=session.horse_data.get('purpose', 'walk'),
                budget=session.horse_data.get('budget', '10000'),
                activity_level=session.horse_data.get('activity_level', 'medium')
            )
            
            # Сохраняем ответ ИИ
            ai_message = AIChatMessage.objects.create(
                session=session,
                role='assistant',
                content=ai_response
            )
            
            # Обновляем время сессии
            session.save()
            
            return JsonResponse({
                'success': True,
                'response': ai_response,
                'message_id': str(ai_message.id)
            })
            
        except AIChatSession.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Сессия не найдена'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=500)
    
    return JsonResponse({'success': False, 'message': 'Invalid method'}, status=405)

@login_required
def ai_chat_session(request, session_id):
    """Получить историю чата сессии"""
    try:
        session = AIChatSession.objects.get(id=session_id, user=request.user)
        messages = session.messages.all().order_by('created_at')
        
        messages_data = []
        for msg in messages:
            messages_data.append({
                'id': str(msg.id),
                'role': msg.role,
                'content': msg.content,
                'time': msg.created_at.strftime('%H:%M')
            })
        
        return JsonResponse({
            'success': True,
            'session': {
                'id': str(session.id),
                'title': session.title,
                'created_at': session.created_at.strftime('%d.%m.%Y %H:%M')
            },
            'messages': messages_data
        })
        
    except AIChatSession.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Сессия не найдена'}, status=404)

@require_GET
def food_detail_api(request, food_id):
    """API для получения деталей корма"""
    try:
        food = FoodItem.objects.get(id=food_id)
        
        # Преобразуем food в словарь
        food_data = {
            'id': str(food.id),
            'name': food.name,
            'description': food.description,
            'short_description': food.short_description,
            
            # Цены
            'base_price': str(food.base_price),
            'premium_price': str(food.premium_price),
            'pro_price': str(food.pro_price),
            
            # Основная информация
            'unit': food.unit,
            'unit_display': food.get_unit_display(),
            'weight': str(food.weight),
            'stock': food.stock,
            'min_order': food.min_order,
            
            # Детальная информация
            'manufacturer': food.manufacturer,
            'production_location': food.production_location,
            'expiration_months': food.expiration_months,
            'storage_conditions': food.storage_conditions,
            'quality_certificates': food.quality_certificates,
            'composition': food.composition,
            'recommendations': food.recommendations,
            
            # Пищевая ценность
            'protein_percent': float(food.protein_percent),
            'fat_percent': float(food.fat_percent),
            'fiber_percent': float(food.fiber_percent),
            'calcium_percent': float(food.calcium_percent),
            'phosphorus_percent': float(food.phosphorus_percent),
            
            # Статусы
            'is_featured': food.is_featured,
            'is_best_seller': food.is_best_seller,
            'is_new': food.is_new,
            'image': food.image.url if food.image else '',
            'category_name': food.category.name if food.category else '',
        }
        
        return JsonResponse(food_data)
    except FoodItem.DoesNotExist:
        return JsonResponse({'error': 'Food item not found'}, status=404)
@require_GET
def food_detail_api(request, food_id):
    """API для получения деталей корма"""
    try:
        food = FoodItem.objects.get(id=food_id)
        
        # Преобразуем food в словарь
        food_data = {
            'id': str(food.id),
            'name': food.name,
            'description': food.description,
            'short_description': food.short_description,
            'base_price': str(food.base_price),
            'premium_price': str(food.premium_price),
            'pro_price': str(food.pro_price),
            'unit': food.unit,
            'unit_display': food.get_unit_display(),
            'weight': str(food.weight),
            'stock': food.stock,
            'min_order': food.min_order,
            'is_featured': food.is_featured,
            'is_best_seller': food.is_best_seller,
            'is_new': food.is_new,
            'image': food.image.url if food.image else '',
            'category_name': food.category.name if food.category else '',
        }
        
        return JsonResponse(food_data)
    except FoodItem.DoesNotExist:
        return JsonResponse({'error': 'Food item not found'}, status=404)
def food_list(request):
    """Список всех кормов с фильтрацией"""
    # Получаем все активные категории
    categories = FoodCategory.objects.filter(is_active=True).order_by('order')
    
    # Получаем параметры фильтрации
    category_id = request.GET.get('category')
    search_query = request.GET.get('search', '').strip()
    sort_by = request.GET.get('sort', 'newest')
    
    # Базовый запрос
    food_items = FoodItem.objects.filter(is_active=True)
    
    # Фильтрация по категории
    if category_id:
        try:
            category = FoodCategory.objects.get(id=category_id, is_active=True)
            food_items = food_items.filter(category=category)
            current_category = category
        except FoodCategory.DoesNotExist:
            current_category = None
    else:
        current_category = None
    
    # Поиск
    if search_query:
        food_items = food_items.filter(
            Q(name__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(short_description__icontains=search_query)
        )
    
    # Сортировка
    if sort_by == 'price_asc':
        food_items = food_items.order_by('base_price')
    elif sort_by == 'price_desc':
        food_items = food_items.order_by('-base_price')
    elif sort_by == 'rating':
        food_items = food_items.order_by('-rating', '-review_count')
    elif sort_by == 'popular':
        food_items = food_items.order_by('-review_count', '-rating')
    else:  # 'newest'
        food_items = food_items.order_by('-created_at')
    
    # Получаем дополнительные списки для шаблона
    best_sellers = FoodItem.objects.filter(
        is_active=True, 
        is_best_seller=True
    )[:4]
    
    new_items = FoodItem.objects.filter(
        is_active=True, 
        is_new=True
    )[:4]
    
    featured_items = FoodItem.objects.filter(
        is_active=True, 
        is_featured=True
    )[:4]
    
    context = {
        'categories': categories,
        'food_items': food_items,
        'current_category': current_category,
        'search_query': search_query,
        'sort_by': sort_by,
        'total_items': food_items.count(),
        'best_sellers': best_sellers,  # Добавлено
        'new_items': new_items,        # Добавлено
        'featured_items': featured_items,  # Добавлено
    }
    
    # Информация о пользователе для отображения цен
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            context['user_profile'] = {
                'subscription': profile.subscription,
                'subscription_display': profile.get_subscription_display_name(),
                'is_premium': profile.is_premium()
            }
        except:
            pass
    
    return render(request, 'food/food.html', context)
def food_detail(request, food_id):
    """Детальная страница товара"""
    try:
        food = get_object_or_404(FoodItem, id=food_id, is_active=True)
    except:
        return render(request, 'food/404.html', {'message': 'Товар не найден'})
    
    # Получаем цену для пользователя
    user_price = food.base_price
    if request.user.is_authenticated:
        try:
            user_price = food.get_price_for_user(request.user)
        except:
            pass
    
    # Похожие товары (из той же категории)
    similar_items = []
    if food.category:
        similar_items = FoodItem.objects.filter(
            category=food.category,
            is_active=True
        ).exclude(id=food.id)[:4]
    
    # Контекст для шаблона
    context = {
        'food': food,
        'similar_items': similar_items,
        'user_price': user_price,
    }
    
    # Используем новый современный шаблон
    return render(request, 'food/food_detail_modern.html', context)
def get_categories(request):
    """Получить список категорий для AJAX"""
    categories = FoodCategory.objects.filter(is_active=True).order_by('order')
    
    categories_data = [
        {
            'id': str(cat.id),
            'name': cat.name,
            'icon': cat.icon,
            'description': cat.description,
            'item_count': cat.items.filter(is_active=True).count()
        }
        for cat in categories
    ]
    
    return JsonResponse({
        'success': True,
        'categories': categories_data
    })

@login_required
def search_food(request):
    """Поиск товаров"""
    if request.method == 'GET':
        query = request.GET.get('q', '').strip()
        
        if len(query) < 2:
            return JsonResponse({'success': True, 'items': []})
        
        items = FoodItem.objects.filter(
            Q(is_active=True) &
            (Q(name__icontains=query) |
             Q(description__icontains=query) |
             Q(short_description__icontains=query))
        )[:10]
        
        items_data = []
        for item in items:
            price = item.get_price_for_user(request.user)
            items_data.append({
                'id': str(item.id),
                'name': item.name,
                'price': float(price),
                'unit': item.get_unit_display(),
                'image_url': item.image.url if item.image else '/static/images/food_default.jpg',
                'category': item.category.name if item.category else 'Корма'
            })
        
        return JsonResponse({
            'success': True,
            'query': query,
            'items': items_data
        })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@login_required
def filter_food(request):
    """Фильтрация товаров"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            category_id = data.get('category_id')
            min_price = data.get('min_price')
            max_price = data.get('max_price')
            in_stock = data.get('in_stock')
            sort_by = data.get('sort_by', 'newest')
            
            items = FoodItem.objects.filter(is_active=True)
            
            # Фильтр по категории
            if category_id:
                items = items.filter(category_id=category_id)
            
            # Фильтр по цене
            if min_price is not None:
                items = items.filter(base_price__gte=min_price)
            if max_price is not None:
                items = items.filter(base_price__lte=max_price)
            
            # Фильтр по наличию
            if in_stock:
                items = items.filter(stock__gt=0)
            
            # Сортировка
            if sort_by == 'price_asc':
                items = items.order_by('base_price')
            elif sort_by == 'price_desc':
                items = items.order_by('-base_price')
            elif sort_by == 'rating':
                items = items.order_by('-rating')
            elif sort_by == 'popular':
                items = items.order_by('-review_count')
            else:  # 'newest'
                items = items.order_by('-created_at')
            
            items_data = []
            for item in items:
                price = item.get_price_for_user(request.user)
                items_data.append({
                    'id': str(item.id),
                    'name': item.name,
                    'description': item.short_description or item.description[:100],
                    'price': float(price),
                    'original_price': float(item.base_price),
                    'unit': f"{item.weight} {item.get_unit_display()}",
                    'image_url': item.image.url if item.image else '/static/images/food_default.jpg',
                    'category': item.category.name if item.category else 'Корма',
                    'rating': float(item.rating),
                    'review_count': item.review_count,
                    'is_best_seller': item.is_best_seller,
                    'is_new': item.is_new,
                    'discount_percentage': item.get_discount_percentage(),
                    'is_in_stock': item.is_in_stock,
                    'stock': item.stock
                })
            
            return JsonResponse({
                'success': True,
                'items': items_data,
                'total': len(items_data)
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка фильтрации: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@login_required
def add_review(request):
    """Добавить отзыв о товаре"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            food_id = data.get('food_id')
            rating = data.get('rating')
            comment = data.get('comment', '').strip()
            
            if not food_id or not rating:
                return JsonResponse({
                    'success': False,
                    'message': 'Не заполнены обязательные поля'
                })
            
            food = FoodItem.objects.get(id=food_id, is_active=True)
            
            # Проверяем, не оставлял ли пользователь уже отзыв
            existing_review = FoodReview.objects.filter(food=food, user=request.user).first()
            
            if existing_review:
                existing_review.rating = rating
                existing_review.comment = comment
                existing_review.save()
            else:
                review = FoodReview.objects.create(
                    food=food,
                    user=request.user,
                    rating=rating,
                    comment=comment
                )
            
            # Обновляем рейтинг товара
            reviews = FoodReview.objects.filter(food=food, is_approved=True)
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg'] or 0
            
            food.rating = avg_rating
            food.review_count = reviews.count()
            food.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Отзыв успешно добавлен',
                'new_rating': float(food.rating),
                'review_count': food.review_count
            })
            
        except FoodItem.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Товар не найден'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка добавления отзыва: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})
