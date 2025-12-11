from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from .models import UserProfile, Horse
from cart.models import FoodOrder
from django.contrib.auth import logout as auth_logout

@login_required
def profile_view(request):
    """Страница профиля пользователя с динамическими данными"""
    user = request.user
    profile = user.profile
    
    # Получаем лошадей пользователя
    user_horses = Horse.objects.filter(owner=user)
    
    # Получаем заказы кормов пользователя
    user_food_orders = FoodOrder.objects.filter(user=user).order_by('-created_at')[:10]
    
    # Получаем корзину пользователя
    from cart.models import Cart
    try:
        user_cart = Cart.objects.get(user=user)
        cart_items = user_cart.items.all()
    except Cart.DoesNotExist:
        user_cart = None
        cart_items = []
    
    # Подготавливаем данные для контекста
    context = {
        'user': user,
        'profile': profile,
        'horses': user_horses,
        'orders': user_food_orders,
        'cart': user_cart,
        'cart_items': cart_items,
        'subscription_display': profile.get_subscription_display_name(),
        'is_premium': profile.is_premium(),
    }
    
    return render(request, 'user_profile/profile.html', context)

@login_required
@csrf_exempt
def update_profile(request):
    """Обновление данных профиля"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = request.user
            profile = user.profile
            
            # Обновляем данные пользователя
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'email' in data:
                user.email = data['email']
            
            user.save()
            
            # Обновляем профиль
            if 'phone' in data:
                profile.phone = data['phone']
            if 'address' in data:
                profile.address = data['address']
            
            profile.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Профиль успешно обновлен',
                'user': {
                    'username': user.username,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'phone': profile.phone,
                    'address': profile.address,
                    'subscription': profile.subscription,
                    'subscription_display': profile.get_subscription_display_name()
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка обновления: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@login_required
@csrf_exempt
def update_subscription(request):
    """Обновление подписки пользователя"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            subscription_type = data.get('subscription_type')
            
            if subscription_type not in ['free', 'premium', 'pro']:
                return JsonResponse({
                    'success': False,
                    'message': 'Неверный тип подписки'
                })
            
            profile = request.user.profile
            profile.subscription = subscription_type
            profile.subscription_active = True
            profile.save()
            
            return JsonResponse({
                'success': True,
                'message': f'Подписка изменена на {subscription_type}',
                'subscription': subscription_type,
                'subscription_display': profile.get_subscription_display_name()
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка обновления подписки: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@login_required
def get_profile_data(request):
    """Получение данных профиля для AJAX"""
    user = request.user
    profile = user.profile
    
    # Получаем лошадей пользователя
    horses = Horse.objects.filter(owner=user)
    horses_data = [
        {
            'id': str(horse.id),
            'name': horse.name,
            'breed': horse.get_breed_display(),
            'age': horse.age,
            'color': horse.color,
            'description': horse.description
        }
        for horse in horses
    ]
    
    # Получаем заказы кормов пользователя
    from cart.models import FoodOrder
    orders = FoodOrder.objects.filter(user=user).order_by('-created_at')[:10]
    orders_data = [
        {
            'id': str(order.id),
            'order_number': order.order_number,
            'items_count': order.items.count(),
            'total': float(order.total),
            'status': order.get_status_display(),
            'status_class': order.status,
            'created_at': order.created_at.strftime('%d.%m.%Y %H:%M')
        }
        for order in orders
    ]
    
    # Получаем корзину
    from cart.models import Cart
    try:
        cart = Cart.objects.get(user=user)
        cart_items_count = cart.total_items
        cart_subtotal = float(cart.subtotal)
    except Cart.DoesNotExist:
        cart_items_count = 0
        cart_subtotal = 0
    
    # Рассчитываем статистику
    total_orders = orders.count()
    total_spent = sum([float(order.total) for order in orders])
    
    # Расчет лет с нами
    from datetime import datetime
    years_with_us = max(1, (datetime.now().date() - user.date_joined.date()).days // 365)
    
    # Расчет экономии
    total_savings = 0
    if profile.subscription == 'premium':
        total_savings = total_spent * 0.15
    elif profile.subscription == 'pro':
        total_savings = total_spent * 0.25
    
    return JsonResponse({
        'user': {
            'username': user.username,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'email': user.email or '',
            'full_name': profile.get_full_name(),
            'phone': profile.phone or '',
            'address': profile.address or '',
            'subscription': profile.subscription,
            'subscription_display': profile.get_subscription_display_name(),
            'subscription_active': profile.subscription_active,
            'is_premium': profile.is_premium(),
            'joined_date': user.date_joined.strftime('%d.%m.%Y')
        },
        'stats': {
            'horses_count': horses.count(),
            'orders_count': total_orders,
            'cart_items_count': cart_items_count,
            'cart_subtotal': cart_subtotal,
            'years_count': years_with_us,
            'total_spent': total_spent,
            'total_savings': total_savings,
            'rating': 4.8
        },
        'horses': horses_data,
        'orders': orders_data
    })

@login_required
@csrf_exempt
def add_horse(request):
    """Добавление новой лошади"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            horse = Horse.objects.create(
                owner=request.user,
                name=data.get('name', 'Новая лошадь'),
                breed=data.get('breed', 'other'),
                age=data.get('age', 5),
                color=data.get('color', ''),
                description=data.get('description', '')
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Лошадь успешно добавлена',
                'horse': {
                    'id': str(horse.id),
                    'name': horse.name,
                    'breed': horse.get_breed_display(),
                    'age': horse.age,
                    'color': horse.color
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка добавления лошади: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@login_required
@csrf_exempt
def logout_view(request):
    """Выход из системы"""
    auth_logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Вы успешно вышли из системы',
        'redirect_url': '/'
    })