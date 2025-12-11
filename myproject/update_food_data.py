#!/usr/bin/env python
"""
Обновление тестовых данных с дополнительной информацией
"""

import os
import sys
import django
from decimal import Decimal

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'horse_plant.settings')

try:
    django.setup()
except Exception as e:
    print(f"Ошибка: {e}")
    sys.exit(1)

from food.models import FoodItem, FoodCategory
from django.contrib.auth.models import User

def update_food_data():
    print("🔄 Обновление данных кормов...")
    
    # Получаем или создаем категории
    cereals_cat, _ = FoodCategory.objects.get_or_create(
        name='Зерновые корма',
        defaults={'icon': '🌾', 'order': 1}
    )
    
    pellets_cat, _ = FoodCategory.objects.get_or_create(
        name='Гранулированные корма',
        defaults={'icon': '🥗', 'order': 2}
    )
    
    vitamins_cat, _ = FoodCategory.objects.get_or_create(
        name='Витаминные добавки',
        defaults={'icon': '💊', 'order': 3}
    )
    
    # Данные для разных кормов
    food_data = [
        # 1. Овёс премиум
        {
            'name': 'Овёс премиум',
            'category': cereals_cat,
            'manufacturer': 'ЗАО "Зерновые технологии", Россия',
            'production_location': 'г. Воронеж, ул. Аграрная, 8',
            'expiration_months': 18,
            'storage_conditions': 'В сухом помещении, защищенном от влаги и вредителей',
            'quality_certificates': 'ГОСТ 28673-90, Organic Certified',
            'composition': 'Овёс очищенный 100%',
            'protein_percent': 14.00,
            'fat_percent': 4.00,
            'fiber_percent': 8.00,
            'calcium_percent': 0.80,
            'phosphorus_percent': 0.60,
            'recommendations': 'Давать взрослой лошади 2-3 кг в сутки, разделяя на 2-3 кормления. Не превышать суточную норму.',
            'short_description': 'Отборный овёс высшего качества для ежедневного рациона лошадей.',
            'base_price': Decimal('765.00'),
            'premium_price': Decimal('650.00'),
            'pro_price': Decimal('550.00'),
            'weight': Decimal('20.00'),
            'unit': 'kg',
            'stock': 45,
            'is_new': True,
        },
        # 2. Премиум гранулы
        {
            'name': 'Премиум гранулы',
            'category': pellets_cat,
            'manufacturer': 'ООО "ЭквиФуд", Россия',
            'production_location': 'г. Краснодар, ул. Зерновая, 15',
            'expiration_months': 12,
            'storage_conditions': 'В сухом прохладном месте, при температуре от +5°C до +25°C',
            'quality_certificates': 'ГОСТ Р 55364-2012, ISO 22000:2005',
            'composition': 'Овёс экструдированный 35%, Ячмень 25%, Отруби пшеничные 15%, Шрот подсолнечный 12%, Травяная мука 8%, Премикс витаминно-минеральный 5%',
            'protein_percent': 14.00,
            'fat_percent': 4.50,
            'fiber_percent': 9.00,
            'calcium_percent': 0.85,
            'phosphorus_percent': 0.65,
            'recommendations': 'Для спортивных лошадей 2-4 кг в сутки. Перед соревнованиями увеличить норму на 20%.',
            'short_description': 'Сбалансированный гранулированный корм с витаминами и минералами для спортивных лошадей.',
            'base_price': Decimal('1060.00'),
            'premium_price': Decimal('850.00'),
            'pro_price': Decimal('750.00'),
            'weight': Decimal('25.00'),
            'unit': 'kg',
            'stock': 32,
            'is_best_seller': True,
        },
        # 3. Витаминный комплекс
        {
            'name': 'Витаминный комплекс',
            'category': vitamins_cat,
            'manufacturer': 'ООО "ВетФарм", Германия',
            'production_location': 'г. Берлин, Германия',
            'expiration_months': 24,
            'storage_conditions': 'При комнатной температуре, в оригинальной упаковке',
            'quality_certificates': 'EU Certified, GMP, Halal',
            'composition': 'Витамин A 5000 МЕ, Витамин D3 1000 МЕ, Витамин E 50 МЕ, Кальций карбонат, Фосфат дикальция, Магний оксид',
            'protein_percent': 0.00,
            'fat_percent': 0.00,
            'fiber_percent': 0.00,
            'calcium_percent': 15.00,
            'phosphorus_percent': 10.00,
            'recommendations': 'Давать 30 г на 100 кг веса лошади ежедневно, смешивая с кормом.',
            'short_description': 'Комплекс витаминов и минералов для поддержания здоровья копыт, шерсти и общего состояния.',
            'base_price': Decimal('1600.00'),
            'premium_price': Decimal('1200.00'),
            'pro_price': Decimal('1000.00'),
            'weight': Decimal('0.80'),
            'unit': 'kg',
            'stock': 28,
            'is_featured': True,
        },
        # 4. Энергетические гранулы
        {
            'name': 'Энергетические гранулы',
            'category': pellets_cat,
            'manufacturer': 'ООО "СпортКонь", Россия',
            'production_location': 'г. Ростов-на-Дону, ул. Спортивная, 10',
            'expiration_months': 10,
            'storage_conditions': 'В вакуумной упаковке, избегать прямых солнечных лучей',
            'quality_certificates': 'ГОСТ, Ветеринарный сертификат',
            'composition': 'Кукуруза 40%, Овёс 30%, Ячмень 20%, Патока 5%, Премикс энергетический 5%',
            'protein_percent': 16.00,
            'fat_percent': 6.00,
            'fiber_percent': 6.00,
            'calcium_percent': 0.70,
            'phosphorus_percent': 0.55,
            'recommendations': 'Для лошадей с повышенными нагрузками 3-5 кг в сутки за 2 часа до тренировки.',
            'short_description': 'Высокоэнергетический корм для лошадей с повышенными нагрузками.',
            'base_price': Decimal('1100.00'),
            'premium_price': Decimal('950.00'),
            'pro_price': Decimal('850.00'),
            'weight': Decimal('10.00'),
            'unit': 'kg',
            'stock': 25,
            'is_new': True,
        },
        # 5. Ячмень отборный
        {
            'name': 'Ячмень отборный',
            'category': cereals_cat,
            'manufacturer': 'СПК "Зерно России", Россия',
            'production_location': 'Алтайский край, с. Зерновое',
            'expiration_months': 16,
            'storage_conditions': 'В мешках, на деревянных поддонах, влажность не более 14%',
            'quality_certificates': 'ГОСТ 28672-90, Organic',
            'composition': 'Ячмень очищенный 100%',
            'protein_percent': 11.00,
            'fat_percent': 2.50,
            'fiber_percent': 5.50,
            'calcium_percent': 0.60,
            'phosphorus_percent': 0.45,
            'recommendations': 'Для поддержания оптимального веса 1-2 кг в сутки в сочетании с сеном.',
            'short_description': 'Качественный ячмень для поддержания оптимального веса лошадей.',
            'base_price': Decimal('650.00'),
            'premium_price': Decimal('550.00'),
            'pro_price': Decimal('450.00'),
            'weight': Decimal('20.00'),
            'unit': 'kg',
            'stock': 38,
        },
        # 6. Пробиотики для ЖКТ
        {
            'name': 'Пробиотики для ЖКТ',
            'category': vitamins_cat,
            'manufacturer': 'ООО "БиоВет", США',
            'production_location': 'г. Чикаго, США',
            'expiration_months': 18,
            'storage_conditions': 'В холодильнике при температуре +2°C до +8°C',
            'quality_certificates': 'FDA Approved, GMP Certified',
            'composition': 'Lactobacillus acidophilus, Bifidobacterium bifidum, Enterococcus faecium, Фруктоолигосахариды',
            'protein_percent': 0.00,
            'fat_percent': 0.00,
            'fiber_percent': 0.00,
            'calcium_percent': 0.00,
            'phosphorus_percent': 0.00,
            'recommendations': 'Давать 15 г в сутки курсом 30 дней при проблемах с пищеварением.',
            'short_description': 'Специальная добавка для улучшения пищеварения и усвоения кормов.',
            'base_price': Decimal('1000.00'),
            'premium_price': Decimal('800.00'),
            'pro_price': Decimal('700.00'),
            'weight': Decimal('0.80'),
            'unit': 'kg',
            'stock': 22,
            'is_best_seller': True,
        }
    ]
    
    for data in food_data:
        food, created = FoodItem.objects.update_or_create(
            name=data['name'],
            defaults=data
        )
        if created:
            print(f"✅ Создан: {food.name}")
        else:
            print(f"🔄 Обновлен: {food.name}")
    
    print(f"\n📊 Всего кормов: {FoodItem.objects.count()}")
    print("✅ Данные успешно обновлены!")

if __name__ == '__main__':
    update_food_data()