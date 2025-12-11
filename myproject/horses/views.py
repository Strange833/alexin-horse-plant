from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
from datetime import datetime, timedelta
from .models import Horse, HorseBooking
from django.db.models import Sum  # Добавляем импорт Sum
from user_profile.models import UserProfile
from decimal import Decimal

def horses_list(request):
    """Список всех лошадей для бронирования"""
    horses = Horse.objects.filter(is_active=True).order_by('name')
    return render(request, 'horses/horses_list.html', {'horses': horses})

@login_required
def book_horse(request, horse_id):
    """Страница бронирования конкретной лошади (старый метод)"""
    horse = get_object_or_404(Horse, id=horse_id, is_active=True)
    
    # Рассчет цены для пользователя
    user = request.user
    base_price = horse.base_price_hour
    user_price = horse.get_price_for_user(user)
    discount = ((base_price - user_price) / base_price) * 100 if base_price > 0 else 0
    
    context = {
        'horse': horse,
        'base_price': base_price,
        'user_price': user_price,
        'discount': discount,
        'is_available': horse.is_available
    }
    
    return render(request, 'horses/book_horse.html', context)

def get_horse_details(request, horse_id):
    """Получение деталей лошади для AJAX"""
    try:
        horse = get_object_or_404(Horse, id=horse_id, is_active=True)
        
        return JsonResponse({
            'success': True,
            'horse': {
                'id': str(horse.id),
                'name': horse.name,
                'breed': horse.get_breed_display(),
                'breed_raw': horse.breed,
                'age': horse.age,
                'color': horse.color,
                'level': horse.get_level_display(),
                'description': horse.description,
                'base_price_hour': float(horse.base_price_hour),
                'premium_price_hour': float(horse.premium_price_hour),
                'pro_price_hour': float(horse.pro_price_hour),
                'is_available': horse.is_available,
                'image_url': horse.image.url if horse.image else None
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Ошибка получения данных лошади: {str(e)}'
        })

def get_available_dates(request):
    """Получение доступных дат для бронирования"""
    try:
        # Берем ближайшие 30 дней
        start_date = datetime.now().date()
        end_date = start_date + timedelta(days=30)
        
        available_dates = []
        current_date = start_date
        
        while current_date <= end_date:
            # Проверяем, не выходной ли (суббота/воскресенье)
            if current_date.weekday() < 5:  # Пн-Пт
                available_dates.append(current_date.strftime('%Y-%m-%d'))
            current_date += timedelta(days=1)
        
        return JsonResponse({
            'success': True,
            'dates': available_dates,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Ошибка получения дат: {str(e)}'
        })

def get_available_times(request, date_str):
    """Получение доступного времени на конкретную дату"""
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # Время работы: с 9:00 до 20:00
        start_time = datetime.combine(date_obj, datetime.min.time().replace(hour=9))
        end_time = datetime.combine(date_obj, datetime.min.time().replace(hour=20))
        
        available_times = []
        current_time = start_time
        
        while current_time < end_time:
            available_times.append(current_time.strftime('%H:%M'))
            current_time += timedelta(hours=1)
        
        return JsonResponse({
            'success': True,
            'date': date_str,
            'times': available_times,
            'opening_hours': {
                'start': '09:00',
                'end': '20:00'
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Ошибка получения времени: {str(e)}'
        })

@login_required
@csrf_exempt
def create_booking(request):
    """Создание бронирования лошади"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            user = request.user
            
            horse_id = data.get('horse_id')
            booking_date = data.get('booking_date')
            booking_time = data.get('booking_time')
            client_name = data.get('client_name')
            client_phone = data.get('client_phone')
            client_comment = data.get('client_comment', '')
            duration_hours = int(data.get('duration_hours', 1))
            
            # Валидация данных
            if not all([horse_id, booking_date, booking_time, client_name, client_phone]):
                return JsonResponse({
                    'success': False,
                    'message': 'Заполните все обязательные поля'
                })
            
            # Проверка существования лошади
            try:
                horse = Horse.objects.get(id=horse_id)
            except Horse.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Лошадь не найдена'
                })
            
            # Рассчет цены с учетом подписки ДО создания брони
            user_profile = user.profile
            base_price = horse.base_price_hour
            user_price = horse.get_price_for_user(user)
            
            # ПРАВИЛЬНЫЙ расчет скидки
            if base_price > 0:
                discount = ((float(base_price) - float(user_price)) / float(base_price)) * 100
            else:
                discount = 0
            
            total_price = user_price * Decimal(duration_hours)
            
            # Создание бронирования
            booking = HorseBooking.objects.create(
                user=user,
                horse=horse,
                booking_date=booking_date,
                booking_time=booking_time,
                duration_hours=duration_hours,
                client_name=client_name,
                client_phone=client_phone,
                client_comment=client_comment,
                base_price_hour=base_price,
                user_price_hour=user_price,
                discount_percent=discount,
                total_price=total_price,
                status='confirmed'  # Сразу подтверждаем
            )
            
            # Генерация номера брони
            booking_number = f"BK{booking.created_at.strftime('%Y%m%d')}{str(booking.id).split('-')[0].upper()}"
            
            return JsonResponse({
                'success': True,
                'message': 'Бронирование успешно создано!',
                'booking': {
                    'id': str(booking.id),
                    'booking_number': booking_number,
                    'horse_id': str(horse.id),
                    'horse_name': horse.name,
                    'horse_breed': horse.get_breed_display(),
                    'booking_date': booking_date,
                    'booking_time': booking_time,
                    'duration_hours': duration_hours,
                    'total_price': float(total_price),
                    'user_price_per_hour': float(user_price),
                    'base_price_per_hour': float(base_price),
                    'discount_percent': float(discount),
                    'status': booking.status,
                    'status_display': booking.get_display_status(),
                    'created_at': booking.created_at.strftime('%d.%m.%Y %H:%M')
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка создания бронирования: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})
@login_required
def get_user_bookings(request):
    """Получить все бронирования пользователя"""
    user = request.user
    bookings = HorseBooking.objects.filter(user=user).order_by('-booking_date', '-booking_time')
    
    bookings_data = []
    for booking in bookings:
        booking_number = f"BK{booking.created_at.strftime('%Y%m%d')}{str(booking.id).split('-')[0].upper()}"
        
        bookings_data.append({
            'id': str(booking.id),
            'booking_number': booking_number,
            'horse_name': booking.horse.name,
            'horse_breed': booking.horse.get_breed_display(),
            'horse_image': booking.horse.image.url if booking.horse.image else None,
            'booking_date': booking.booking_date.strftime('%d.%m.%Y'),
            'booking_time': booking.booking_time.strftime('%H:%M'),
            'duration_hours': booking.duration_hours,
            'total_price': float(booking.total_price),
            'user_price_per_hour': float(booking.user_price_hour),
            'discount_percent': float(booking.discount_percent),
            'status': booking.status,
            'status_display': booking.get_display_status(),
            'status_class': booking.get_status_class(),
            'is_paid': booking.is_paid,
            'client_name': booking.client_name,
            'client_phone': booking.client_phone,
            'created_at': booking.created_at.strftime('%d.%m.%Y %H:%M')
        })
    
    return JsonResponse({
        'success': True,
        'bookings': bookings_data,
        'count': len(bookings_data)
    })

@login_required
@csrf_exempt
def cancel_booking(request, booking_id):
    """Отмена бронирования"""
    if request.method == 'POST':
        try:
            booking = get_object_or_404(HorseBooking, id=booking_id, user=request.user)
            
            # Проверяем, можно ли отменить бронь
            booking_datetime = datetime.combine(booking.booking_date, booking.booking_time)
            time_diff = (booking_datetime - datetime.now()).total_seconds() / 3600
            
            if time_diff < 3:  # Меньше 3 часов до начала
                return JsonResponse({
                    'success': False,
                    'message': 'Бронь можно отменить не менее чем за 3 часа до начала'
                })
            
            booking.status = 'cancelled'
            booking.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Бронь успешно отменена',
                'booking': {
                    'id': str(booking.id),
                    'status': booking.status,
                    'status_display': booking.get_display_status()
                }
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка отмены брони: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

def check_booking_availability(request):
    """Проверка доступности времени для бронирования"""
    try:
        horse_id = request.GET.get('horse_id')
        booking_date = request.GET.get('date')
        booking_time = request.GET.get('time')
        
        if not all([horse_id, booking_date, booking_time]):
            return JsonResponse({
                'success': False,
                'message': 'Не указаны все параметры'
            })
        
        # Проверяем существование лошади
        try:
            horse = Horse.objects.get(id=horse_id)
        except Horse.DoesNotExist:
            return JsonResponse({
                'success': False,
                'available': False,
                'message': 'Лошадь не найдена'
            })
        
        # Проверяем, доступна ли лошадь вообще
        if not horse.is_available:
            return JsonResponse({
                'success': True,
                'available': False,
                'message': 'Лошадь в данный момент недоступна для бронирования'
            })
        
        # Проверяем, не занято ли это время
        existing_booking = HorseBooking.objects.filter(
            horse=horse,
            booking_date=booking_date,
            booking_time=booking_time,
            status__in=['pending', 'confirmed']
        ).exists()
        
        if existing_booking:
            return JsonResponse({
                'success': True,
                'available': False,
                'message': 'Это время уже занято'
            })
        
        return JsonResponse({
            'success': True,
            'available': True,
            'message': 'Время доступно для бронирования'
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Ошибка проверки доступности: {str(e)}'
        })

@login_required
def get_user_booking_stats(request):
    """Получить статистику бронирований пользователя"""
    user = request.user
    
    try:
        total_bookings = HorseBooking.objects.filter(user=user).count()
        confirmed_bookings = HorseBooking.objects.filter(user=user, status='confirmed').count()
        total_spent = HorseBooking.objects.filter(user=user, status__in=['confirmed', 'completed']).aggregate(
            total=Sum('total_price')
        )['total'] or 0
        
        # Расчет сэкономленных средств
        profile = user.profile
        total_savings = 0
        if profile.subscription_active:
            bookings = HorseBooking.objects.filter(user=user, status__in=['confirmed', 'completed'])
            for booking in bookings:
                if profile.subscription == 'premium':
                    savings = (booking.base_price_hour - booking.horse.premium_price_hour) * booking.duration_hours
                elif profile.subscription == 'pro':
                    savings = (booking.base_price_hour - booking.horse.pro_price_hour) * booking.duration_hours
                total_savings += float(savings)
        
        return JsonResponse({
            'success': True,
            'stats': {
                'total_bookings': total_bookings,
                'confirmed_bookings': confirmed_bookings,
                'total_spent': float(total_spent),
                'total_savings': total_savings,
                'average_booking_value': float(total_spent / total_bookings) if total_bookings > 0 else 0
            }
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Ошибка получения статистики: {str(e)}'
        })
@login_required
def get_user_bookings_api(request):
    """Получить бронирования пользователя для AJAX"""
    user = request.user
    bookings = HorseBooking.objects.filter(user=user).order_by('-booking_date', '-booking_time')
    
    bookings_data = []
    for booking in bookings:
        booking_number = f"BK{booking.created_at.strftime('%Y%m%d')}{str(booking.id).split('-')[0].upper()}"
        
        bookings_data.append({
            'id': str(booking.id),
            'booking_number': booking_number,
            'horse_name': booking.horse.name,
            'horse_breed': booking.horse.get_breed_display(),
            'horse_image': booking.horse.image.url if booking.horse.image else '/static/images/horse_default.jpg',
            'booking_date': booking.booking_date.strftime('%d.%m.%Y'),
            'booking_time': booking.booking_time.strftime('%H:%M'),
            'duration_hours': booking.duration_hours,
            'total_price': float(booking.total_price),
            'user_price_per_hour': float(booking.user_price_hour),
            'base_price_per_hour': float(booking.base_price_hour),
            'discount_percent': float(booking.discount_percent),
            'status': booking.status,
            'status_display': booking.get_display_status(),
            'status_class': booking.get_status_class(),
            'is_paid': booking.is_paid,
            'created_at': booking.created_at.strftime('%d.%m.%Y %H:%M')
        })
    
    return JsonResponse({
        'success': True,
        'bookings': bookings_data,
        'count': len(bookings_data)
    })