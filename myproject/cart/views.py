from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Cart, CartItem, FoodOrder, FoodOrderItem
from food.models import FoodItem
import uuid
from datetime import datetime
from decimal import Decimal

@login_required
def cart_view(request):
    """Страница корзины"""
    cart, created = Cart.objects.get_or_create(user=request.user)
    cart_items = cart.items.all()
    
    assembly_cost = cart.get_assembly_cost()
    
    try:
        profile = request.user.profile
        subscription = profile.subscription
        is_premium = profile.is_premium()
        
        if subscription == 'pro' and is_premium:
            discount_percentage = Decimal('20')
        elif subscription == 'premium' and is_premium:
            discount_percentage = Decimal('10')
        else:
            discount_percentage = Decimal('0')
            
        # Правильно: используем Decimal
        discount = cart.subtotal * (discount_percentage / Decimal('100'))
        delivery_cost = cart.get_delivery_cost('courier', subscription if is_premium else None)
        
    except:
        discount_percentage = Decimal('0')
        discount = Decimal('0')
        delivery_cost = cart.get_delivery_cost('courier')
    
    subtotal = cart.subtotal
    total_amount = subtotal - discount + delivery_cost + assembly_cost
    
    # Конвертируем Decimal в float для шаблона (если нужно)
    context = {
        'cart': cart,
        'cart_items': cart_items,
        'subtotal': float(subtotal),
        'discount': float(discount),
        'discount_percentage': float(discount_percentage),
        'delivery_cost': float(delivery_cost),
        'assembly_cost': float(assembly_cost),
        'total_amount': float(total_amount),
        'today': datetime.now(),
    }
    
    try:
        profile = request.user.profile
        context['user_profile'] = {
            'subscription': profile.subscription,
            'subscription_display': profile.get_subscription_display_name(),
            'is_premium': profile.is_premium()
        }
    except:
        context['user_profile'] = None
    
    return render(request, 'cart/cart.html', context)
   
@csrf_exempt
@login_required
def add_to_cart(request):
    """Добавить товар в корзину"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            food_id = data.get('food_id')
            quantity = int(data.get('quantity', 1))
            
            food = get_object_or_404(FoodItem, id=food_id)
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            # Получаем цену для пользователя
            price = food.get_price_for_user(request.user)
            
            # Проверяем, есть ли уже такой товар в корзине
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                food=food,
                defaults={'quantity': quantity, 'price_at_addition': price}
            )
            
            if not created:
                cart_item.quantity += quantity
                cart_item.price_at_addition = price
                cart_item.save()
            
            # Обновляем время изменения корзины
            cart.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Товар добавлен в корзину',
                'cart_total': cart.total_items,
                'item_total': cart_item.total_price,
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@csrf_exempt
@login_required
def update_cart_item(request):
    """Обновить количество товара в корзине"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            quantity = int(data.get('quantity', 1))
            
            cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
            
            if quantity <= 0:
                cart_item.delete()
                message = 'Товар удален из корзины'
            else:
                cart_item.quantity = quantity
                cart_item.save()
                message = 'Количество обновлено'
            
            cart = cart_item.cart
            
            return JsonResponse({
                'success': True,
                'message': message,
                'cart_total': cart.total_items,
                'subtotal': float(cart.subtotal),
                'item_total': float(cart_item.total_price),
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@csrf_exempt
@login_required
def remove_from_cart(request):
    """Удалить товар из корзины"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            item_id = data.get('item_id')
            
            cart_item = get_object_or_404(CartItem, id=item_id, cart__user=request.user)
            cart = cart_item.cart
            cart_item.delete()
            
            return JsonResponse({
                'success': True,
                'message': 'Товар удален из корзины',
                'cart_total': cart.total_items,
                'subtotal': float(cart.subtotal),
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@login_required
def get_cart_data(request):
    """Получить данные корзины с учетом подписки"""
    try:
        cart = Cart.objects.get(user=request.user)
    except Cart.DoesNotExist:
        cart = Cart.objects.create(user=request.user)
        cart.save()
    
    items_data = []
    for item in cart.items.all():
        current_price = item.food.get_price_for_user(request.user)
        
        if item.price_at_addition != current_price:
            item.price_at_addition = current_price
            item.save()
        
        items_data.append({
            'id': str(item.id),
            'food_id': str(item.food.id),
            'name': item.food.name,
            'quantity': item.quantity,
            'price': float(current_price),
            'total': float(item.total_price),
            'unit': item.food.unit,
            'image_url': item.food.image.url if item.food.image else '/static/images/food_default.jpg',
        })
    
    try:
        profile = request.user.profile
        subscription = profile.subscription
        is_premium = profile.is_premium()
        
        if subscription == 'pro' and is_premium:
            discount_percentage = Decimal('20')
        elif subscription == 'premium' and is_premium:
            discount_percentage = Decimal('10')
        else:
            discount_percentage = Decimal('0')
    except:
        discount_percentage = Decimal('0')
        subscription = 'free'
        is_premium = False
    
    subtotal = float(cart.subtotal)
    discount = float(cart.subtotal * (discount_percentage / Decimal('100')))
    
    delivery_method = 'courier'
    delivery_cost = float(cart.get_delivery_cost(delivery_method, subscription if is_premium else None))
    assembly_cost = float(cart.get_assembly_cost())
    
    total = subtotal - discount + delivery_cost + assembly_cost
    
    return JsonResponse({
        'success': True,
        'items': items_data,
        'subtotal': subtotal,
        'discount': discount,
        'discount_percentage': float(discount_percentage),
        'delivery_cost': delivery_cost,
        'assembly_cost': assembly_cost,
        'total': total,
        'total_items': cart.total_items,
        'user_subscription': subscription,
        'is_premium': is_premium,
    })
@csrf_exempt
@login_required
def checkout(request):
    """Оформление заказа"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Получаем корзину пользователя
            cart = get_object_or_404(Cart, user=request.user)
            if cart.total_items == 0:
                return JsonResponse({
                    'success': False,
                    'message': 'Корзина пуста'
                })
            
            # Создаем заказ
            order_number = f"AKZ-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
            
            # Рассчитываем суммы
            subtotal = cart.subtotal
            
            try:
                profile = request.user.profile
                if profile.subscription == 'pro':
                    discount = subtotal * 0.20
                    subscription_applied = 'pro'
                    subscription_savings = discount
                elif profile.subscription == 'premium':
                    discount = subtotal * 0.10
                    subscription_applied = 'premium'
                    subscription_savings = discount
                else:
                    discount = 0
                    subscription_applied = ''
                    subscription_savings = 0
            except:
                discount = 0
                subscription_applied = ''
                subscription_savings = 0
            
            delivery_method = data.get('delivery_method', 'courier')
            delivery_cost = cart.get_delivery_cost(delivery_method, subscription_applied)
            assembly_cost = cart.get_assembly_cost()
            total = subtotal - discount + delivery_cost + assembly_cost
            
            # Создаем заказ кормов
            order = FoodOrder.objects.create(
                user=request.user,
                order_number=order_number,
                
                # Контактная информация
                customer_name=data.get('customer_name'),
                customer_phone=data.get('customer_phone'),
                customer_email=data.get('customer_email', ''),
                
                # Адрес доставки
                delivery_city=data.get('delivery_city'),
                delivery_street=data.get('delivery_street'),
                delivery_house=data.get('delivery_house'),
                delivery_apartment=data.get('delivery_apartment', ''),
                delivery_index=data.get('delivery_index', ''),
                
                # Способ доставки и оплаты
                delivery_method=delivery_method,
                payment_method=data.get('payment_method', 'card'),
                
                # Финансовая информация
                subtotal=subtotal,
                discount=discount,
                delivery_cost=delivery_cost,
                assembly_cost=assembly_cost,
                total=total,
                
                # Подписка
                subscription_applied=subscription_applied,
                subscription_savings=subscription_savings,
                
                # Дополнительно
                promo_code=data.get('promo_code', ''),
                notes=data.get('notes', ''),
            )
            
            # Добавляем товары в заказ кормов
            for cart_item in cart.items.all():
                FoodOrderItem.objects.create(
                    order=order,
                    food=cart_item.food,
                    quantity=cart_item.quantity,
                    price=cart_item.price_at_addition
                )
            
            # Очищаем корзину
            cart.items.all().delete()
            cart.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Заказ успешно оформлен',
                'order_number': order_number,
                'order_id': str(order.id),
                'total': float(total),
                'redirect_url': f'/cart/order-success/{order.id}/'
            })
            
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка оформления заказа: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

@login_required
def order_success(request, order_id):
    """Страница успешного оформления заказа"""
    order = get_object_or_404(FoodOrder, id=order_id, user=request.user)
    
    context = {
        'order': order,
        'order_items': order.items.all(),
    }
    
    return render(request, 'cart/order_success.html', context)

@login_required
def get_order_history(request):
    """Получить историю заказов пользователя"""
    orders = FoodOrder.objects.filter(user=request.user).order_by('-created_at')[:10]
    
    orders_data = []
    for order in orders:
        orders_data.append({
            'id': str(order.id),
            'order_number': order.order_number,
            'date': order.created_at.strftime('%d.%m.%Y %H:%M'),
            'status': order.get_status_display(),
            'status_class': order.status,
            'total': float(order.total),
            'items_count': order.items.count(),
        })
    
    return JsonResponse({'orders': orders_data})
@login_required
@csrf_exempt
def apply_promo_code(request):
    """Применение промокода"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            promo_code = data.get('promo_code', '').strip().upper()
            
            # Пример промокодов
            promo_codes = {
                'HORSE10': 10,  # 10% скидка
                'AKZ2024': 500,  # 500 рублей скидки
                'LOVEHORSE': 15, # 15% скидка
            }
            
            if promo_code in promo_codes:
                discount = promo_codes[promo_code]
                return JsonResponse({
                    'success': True,
                    'message': f'Промокод "{promo_code}" применен!',
                    'discount': discount
                })
            else:
                return JsonResponse({
                    'success': False,
                    'message': 'Недействительный промокод'
                })
                
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Ошибка применения промокода: {str(e)}'
            })
    
    return JsonResponse({'success': False, 'message': 'Неверный метод запроса'})

def cart_count(request):
    """Получить количество товаров в корзине"""
    count = 0
    if request.user.is_authenticated:
        try:
            cart = Cart.objects.get(user=request.user)
            count = cart.total_items  # Используем свойство total_items
        except Cart.DoesNotExist:
            pass
    
    return JsonResponse({'count': count, 'success': True})