# cart/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.cart_view, name='cart'),  # ОСНОВНОЙ путь - используйте name='cart'
    path('api/add/', views.add_to_cart, name='add_to_cart'),
    path('api/update/', views.update_cart_item, name='update_cart_item'),
    path('api/remove/', views.remove_from_cart, name='remove_from_cart'),
    path('api/data/', views.get_cart_data, name='get_cart_data'),
    path('api/checkout/', views.checkout, name='checkout'),
    path('order-success/<uuid:order_id>/', views.order_success, name='order_success'),
    path('api/order-history/', views.get_order_history, name='order_history'),
    path('api/apply-promo/', views.apply_promo_code, name='apply_promo'),
    path('count/', views.cart_count, name='cart_count'),
]