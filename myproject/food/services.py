# food/services.py - сервис для IO Intelligence API
import requests
import json
import os
from django.conf import settings
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

class IOIntelligenceService:
    """Сервис для работы с IO Intelligence API"""
    
    def __init__(self):
        self.base_url = "https://api.intelligence.io.solutions/api/v1/"
        
        # Получаем API ключ из переменных окружения или настроек
        self.api_key = self._get_api_key()
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        print(f"🔧 IO Intelligence Service инициализирован")
        print(f"   Base URL: {self.base_url}")
        print(f"   API Key: {'✅ Установлен' if self.api_key else '❌ НЕТ КЛЮЧА'}")
    
    def _get_api_key(self):
        """Получить API ключ в порядке приоритета"""
        # 1. Из переменных окружения
        api_key = "io-v2-eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJvd25lciI6IjA4NDZkM2Y2LTA5MDktNDg0Yy1iYTk4LTM3MTBiYTMzYmE5YyIsImV4cCI6NDkxOTAyMzE4Nn0.Lg1wha-L4mVoT8Yr_Ozrzx_BrhKlO_LWto5MUONi3busmVcyWZZVZrmtS9FO21RMPdJCNYSsXIoMKsnTqFsa5w"
        if api_key:
            return api_key
        
        # 2. Из настроек Django
        try:
            api_key = getattr(settings, 'IO_INTELLIGENCE_API_KEY', '')
            if api_key:
                return api_key
        except:
            pass
        
        # 3. Попробуем другие названия переменных
        for var_name in ['IO_API_KEY', 'INTELLIGENCE_API_KEY', 'IOINTELLIGENCE_KEY']:
            api_key = os.getenv(var_name)
            if api_key:
                return api_key
        
        return ""
    
    def get_food_recommendation(self, breed, age, weight, purpose, budget, activity_level='medium'):
        """Получить рекомендацию от IO Intelligence API"""
        
        print(f"📨 Запрос к IO Intelligence: {breed}, {age} лет, {weight} кг")
        
        if not self.api_key:
            print("❌ Нет API ключа для IO Intelligence")
            return self._get_fallback_response(breed, age, weight, purpose, budget, activity_level)
        
        try:
            # Системный промпт для лошадей
            system_prompt = """Ты - эксперт по кормлению лошадей с 20-летним опытом.
            
            ФОРМАТ ОТВЕТА:
            🐎 **Анализ параметров**
            🥕 **Рекомендации** (конкретные цифры в кг/день)
            🛒 **Товары из каталога**
            💰 **Стоимость в месяц**
            📅 **Дата следующей закупки**
            💡 **Полезные советы**
            
            Используй эмодзи и будь конкретным. Давай точные цифры в кг."""
            
            user_prompt = f"""Составь рекомендацию по кормлению для лошади:
            
            ПАРАМЕТРЫ:
            - Порода: {breed}
            - Возраст: {age} лет
            - Вес: {weight} кг
            - Цель: {purpose}
            - Бюджет: {budget} руб/месяц
            - Активность: {activity_level}
            
            Дай конкретный рацион с цифрами в кг/день.
            Также предложи конкретные продукты."""
            
            # Используем модель Llama от IO Intelligence
            response = requests.post(
                f"{self.base_url}chat/completions",
                headers=self.headers,
                json={
                    "model": "meta-llama/Llama-3.3-70B-Instruct",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                    "stream": False
                },
                timeout=60  # Увеличил таймаут для IO Intelligence
            )
            
            print(f"📊 Статус IO Intelligence: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Получен ответ от IO Intelligence")
                
                # Извлекаем контент из ответа IO Intelligence
                if 'choices' in data and len(data['choices']) > 0:
                    result = data['choices'][0]['message']['content']
                    print(f"   Длина ответа: {len(result)} символов")
                    return result
                else:
                    print(f"⚠️ Неверный формат ответа от IO Intelligence")
                    return self._get_fallback_response(breed, age, weight, purpose, budget, activity_level)
                    
            elif response.status_code == 401:
                print("❌ Ошибка аутентификации. Проверьте API ключ.")
                return self._get_auth_error_response()
            elif response.status_code == 429:
                print("⚠️ Превышен лимит запросов к IO Intelligence")
                return self._get_rate_limit_response()
            else:
                error_text = response.text[:500] if hasattr(response, 'text') else str(response)
                print(f"❌ Ошибка IO Intelligence {response.status_code}: {error_text}")
                return self._get_fallback_response(breed, age, weight, purpose, budget, activity_level)
                
        except requests.exceptions.ConnectionError:
            print("❌ Не удалось подключиться к IO Intelligence API")
            print("   Проверьте подключение к интернету")
            return self._get_connection_error_response()
            
        except requests.exceptions.Timeout:
            print("❌ Таймаут при подключении к IO Intelligence")
            return self._get_timeout_response()
            
        except Exception as e:
            print(f"❌ Ошибка: {str(e)}")
            return self._get_fallback_response(breed, age, weight, purpose, budget, activity_level)
    
    def test_connection(self):
        """Проверить соединение с IO Intelligence API"""
        try:
            # Запрос списка доступных моделей
            response = requests.get(
                f"{self.base_url}models",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                model_count = len(data.get('data', []))
                print(f"✅ Соединение с IO Intelligence установлено")
                print(f"   Доступно моделей: {model_count}")
                return True, model_count
            else:
                print(f"⚠️ API ответил с кодом: {response.status_code}")
                return False, 0
                
        except Exception as e:
            print(f"❌ Не удалось подключиться: {str(e)}")
            return False, 0
    
    def get_available_models(self):
        """Получить список доступных моделей"""
        try:
            response = requests.get(
                f"{self.base_url}models",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                models = []
                
                for model in data.get('data', []):
                    model_info = {
                        'id': model.get('id'),
                        'context_window': model.get('context_window'),
                        'supports_images': model.get('supports_images_input', False),
                        'precision': model.get('precision'),
                        'latency': model.get('avg_latency_ms_per_day'),
                        'input_price': model.get('input_token_price'),
                        'output_price': model.get('output_token_price')
                    }
                    models.append(model_info)
                
                return models
            return []
            
        except:
            return []
    
    def analyze_and_extract_products(self, ai_response, food_items):
        """Найти товары в ответе IO Intelligence"""
        recommended = []
        
        if not ai_response:
            return recommended
        
        # Приводим ответ к нижнему регистру для поиска
        response_lower = ai_response.lower()
        
        # Ключевые слова для поиска товаров
        keywords = [
            'гранул', 'овёс', 'сено', 'витамин', 'премикс',
            'комбикорм', 'добавк', 'минерал', 'соль', 'корм',
            'премиум', 'люцерн', 'отруб', 'меласс'
        ]
        
        # Поиск по названию товара
        for item in food_items:
            item_name = item.name.lower()
            item_desc = (item.description or "").lower()
            
            # Проверяем ключевые слова
            if any(kw in item_name for kw in keywords):
                recommended.append(str(item.id))
                continue
            
            # Проверяем описание
            if any(kw in item_desc for kw in keywords):
                recommended.append(str(item.id))
                continue
            
            # Проверяем категорию
            if item.category and item.category.name.lower() in response_lower:
                recommended.append(str(item.id))
        
        # Убираем дубликаты
        recommended = list(set(recommended))
        
        # Если ничего не нашли, берем популярные товары
        if not recommended:
            popular_items = food_items.filter(is_featured=True)[:5]
            recommended = [str(item.id) for item in popular_items]
        
        # Ограничиваем количество
        return recommended[:7]
    
    def _get_fallback_response(self, breed, age, weight, purpose, budget, activity_level):
        """Резервный ответ если IO Intelligence не работает"""
        breed_names = {
            'arabian': 'Арабская скаковая',
            'orlov': 'Орловский рысак',
            'trakehner': 'Тракененская',
            'don': 'Донская',
            'budyonny': 'Будённовская',
            'friesian': 'Фризская',
            'hannover': 'Ганноверская',
            'akhalteke': 'Ахалтекинская',
            'other': 'Смешанная порода'
        }
        
        breed_name = breed_names.get(breed, breed)
        
        return f"""🤖 **ЛОКАЛЬНАЯ РЕКОМЕНДАЦИЯ** (IO Intelligence временно недоступен)

🐎 **АНАЛИЗ ПАРАМЕТРОВ:**
- Порода: {breed_name}
- Возраст: {age} лет
- Вес: {weight} кг
- Цель: {purpose}
- Бюджет: {budget} ₽/месяц
- Активность: {activity_level}

🥕 **ОСНОВНОЙ РАЦИОН:**
• Сено луговое: {weight * 0.02:.1f} - {weight * 0.025:.1f} кг/день
• Овёс отборный: {weight * 0.008:.1f} - {weight * 0.012:.1f} кг/день
• Премикс витаминный: 100-150 г/день
• Соль-лизунец: постоянно

🛒 **РЕКОМЕНДУЕМЫЕ ТОВАРЫ:**
1. Премиум гранулы для лошадей
2. Смесь овса и ячменя
3. Витаминный комплекс
4. Лизунец с минералами

💰 **РАСЧЁТ СТОИМОСТИ:**
Примерно {int(float(budget) * 0.7)} - {budget} ₽ в месяц

📅 **ПЛАНИРОВАНИЕ:**
• Следующая закупка: через 30 дней
• Ветосмотр: каждые 6 месяцев

💡 **СОВЕТЫ ЭКСПЕРТА:**
1. Вводите новые корма постепенно
2. Обеспечьте постоянный доступ к воде
3. Следите за состоянием зубов
4. Регулярно взвешивайте лошадь

⚠️ **ДЛЯ ИНТЕЛЛЕКТУАЛЬНЫХ РЕКОМЕНДАЦИЙ:**
Установите API ключ IO Intelligence в настройках!"""
    