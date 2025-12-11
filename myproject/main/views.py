from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from user_profile.models import UserProfile

def index(request):
    """Главная страница"""
    context = {}
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            context['user_profile'] = {
                'username': request.user.username,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'subscription': profile.subscription,
                'subscription_display': profile.get_subscription_display_name(),
                'is_premium': profile.is_premium()
            }
        except:
            pass
    return render(request, 'main/index.html', context)

@csrf_exempt
def register_view(request):
    """Регистрация пользователя"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            username = data.get('username', '').strip()
            email = data.get('email', '').strip()
            password = data.get('password', '')
            
            # Валидация
            if not username:
                return JsonResponse({
                    'success': False, 
                    'message': 'Имя пользователя обязательно'
                })
            
            if not email:
                return JsonResponse({
                    'success': False, 
                    'message': 'Email обязателен'
                })
            
            if len(password) < 8:
                return JsonResponse({
                    'success': False, 
                    'message': 'Пароль должен содержать не менее 8 символов'
                })
            
            # Проверяем, существует ли пользователь
            if User.objects.filter(username=username).exists():
                return JsonResponse({
                    'success': False, 
                    'message': 'Пользователь с таким именем уже существует'
                })
            
            if User.objects.filter(email=email).exists():
                return JsonResponse({
                    'success': False, 
                    'message': 'Пользователь с таким email уже существует'
                })
            
            # Создаем пользователя
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
            
            # Создаем профиль (должно создаться автоматически через сигнал)
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Автоматически входим
            user.backend = 'django.contrib.auth.backends.ModelBackend'
            login(request, user)
            
            return JsonResponse({
                'success': True, 
                'message': 'Регистрация успешна!',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'subscription': profile.subscription,
                    'subscription_display': profile.get_subscription_display_name()
                },
                'redirect_url': '/profile/'  # Перенаправляем на профиль
            })
            
        except Exception as e:
            print(f"Ошибка регистрации: {e}")
            return JsonResponse({
                'success': False, 
                'message': f'Ошибка сервера: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@csrf_exempt
def login_view(request):
    """Вход пользователя"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            username = data.get('username', '').strip()
            password = data.get('password', '')
            
            if not username or not password:
                return JsonResponse({
                    'success': False, 
                    'message': 'Имя пользователя и пароль обязательны'
                })
            
            # Пробуем аутентифицировать
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                login(request, user)
                profile = user.profile
                return JsonResponse({
                    'success': True, 
                    'message': 'Вход выполнен успешно!',
                    'user': {
                        'username': user.username,
                        'email': user.email,
                        'subscription': profile.subscription,
                        'subscription_display': profile.get_subscription_display_name()
                    },
                    'redirect_url': '/profile/'  # Перенаправляем на профиль
                })
            else:
                # Проверяем, существует ли пользователь
                if User.objects.filter(username=username).exists():
                    return JsonResponse({
                        'success': False, 
                        'message': 'Неверный пароль'
                    })
                else:
                    return JsonResponse({
                        'success': False, 
                        'message': 'Пользователь не найден'
                    })
                    
        except Exception as e:
            print(f"Ошибка входа: {e}")
            return JsonResponse({
                'success': False, 
                'message': f'Ошибка сервера: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

def logout_view(request):
    """Выход пользователя"""
    logout(request)
    return JsonResponse({
        'success': True, 
        'message': 'Вы вышли из системы',
        'redirect_url': '/'  # Перенаправляем на главную
    })

def get_user_info(request):
    """Получение информации о пользователе"""
    if request.user.is_authenticated:
        user = request.user
        profile = user.profile
        return JsonResponse({
            'username': user.username,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'email': user.email,
            'is_authenticated': True,
            'subscription': profile.subscription,
            'subscription_display': profile.get_subscription_display_name(),
            'is_premium': profile.is_premium()
        })
    else:
        return JsonResponse({
            'is_authenticated': False
        })

@csrf_exempt
@login_required
def select_subscription(request):
    """Выбор подписки пользователем с главной страницы"""
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
            old_subscription = profile.subscription
            
            # Обновляем подписку
            profile.subscription = subscription_type
            profile.subscription_active = True
            profile.save()
            
            # Сохраняем историю подписки
            from user_profile.models import SubscriptionHistory
            SubscriptionHistory.objects.create(
                user=request.user,
                action=f'Изменена подписка с {old_subscription} на {subscription_type}',
                subscription_type=subscription_type
            )
            
            return JsonResponse({
                'success': True,
                'message': f'Подписка успешно изменена на {profile.get_subscription_display_name()}!',
                'subscription': subscription_type,
                'subscription_display': profile.get_subscription_display_name(),
                'redirect_url': '/profile/'  # Перенаправляем на профиль
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False, 
                'message': f'Ошибка: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})