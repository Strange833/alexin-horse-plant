// Получение CSRF токена для AJAX запросов
function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Функция добавления в корзину
function addToCart(foodId) {
    const quantity = parseInt(document.querySelector(`[data-id="${foodId}"] .quantity-input`).value);
    
    fetch('/cart/api/add/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            food_id: foodId,
            quantity: quantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Обновляем счетчик корзины
            updateCartCount(data.cart_total);
            
            // Показываем уведомление
            const btn = event.target;
            btn.classList.add('added');
            btn.innerHTML = '✓ Добавлено';
            
            setTimeout(() => {
                btn.classList.remove('added');
                btn.innerHTML = '🛒 Добавить в корзину';
            }, 2000);
            
            // Показываем выгоду для подписчиков
            if (window.userSubscription && window.userSubscription !== 'free') {
                // Можно добавить расчет скидки
            }
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка добавления в корзину');
    });
}

// Функция показа деталей корма
function showFoodDetails(foodId) {
    fetch(`/food/api/details/${foodId}/`)
    .then(response => response.json())
    .then(data => {
        // Заполняем модальное окно данными
        document.getElementById('modalTitle').textContent = data.name;
        document.getElementById('modalSubtitle').textContent = data.description.substring(0, 100) + '...';
        document.getElementById('modalImage').src = data.image_url || '/static/images/food_default.jpg';
        document.getElementById('modalManufacturer').textContent = data.manufacturer || 'Не указано';
        document.getElementById('modalLocation').textContent = 'Россия';
        document.getElementById('modalExpiry').textContent = data.expiry_date;
        document.getElementById('modalStorage').textContent = data.storage_conditions || 'Не указано';
        document.getElementById('modalCertificates').textContent = data.certificates || 'Не указано';
        document.getElementById('modalDescription').textContent = data.description;
        document.getElementById('modalRecommendations').textContent = data.recommendations || 'Не указано';
        
        // Заполняем состав
        const compositionList = document.getElementById('modalComposition');
        compositionList.innerHTML = '';
        
        // Парсим состав из текста или используем features
        if (data.composition) {
            const compositionItems = data.composition.split('\n');
            compositionItems.forEach(item => {
                if (item.trim()) {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="composition-name">${item}</span>`;
                    compositionList.appendChild(li);
                }
            });
        }
        
        // Показываем модальное окно
        document.getElementById('foodModal').classList.add('active');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка загрузки деталей корма');
    });
}

// Функция обновления счетчика корзины
function updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = count;
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Управление количеством товара
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            
            if (this.textContent === '+') {
                value = Math.min(value + 1, 10);
            } else {
                value = Math.max(value - 1, 1);
            }
            
            input.value = value;
        });
    });
    
    // Фильтрация по категориям
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            
            // Обновляем активную кнопку
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Фильтруем карточки
            filterFoodCards(category);
        });
    });
    
    // Закрытие модального окна
    document.getElementById('modalClose').addEventListener('click', function() {
        document.getElementById('foodModal').classList.remove('active');
    });
    
    document.getElementById('foodModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
    
    // Получаем информацию о подписке пользователя
    if (window.userData) {
        window.userSubscription = window.userData.subscription || 'free';
    }
});

// Функция фильтрации карточек
function filterFoodCards(category) {
    const foodCards = document.querySelectorAll('.food-card');
    let hasVisibleCards = false;
    
    foodCards.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        
        if (category === 'all' || cardCategory === category) {
            card.style.display = 'block';
            hasVisibleCards = true;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Показываем сообщение, если нет результатов
    let noResultsMsg = document.querySelector('.no-results');
    if (!hasVisibleCards) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'no-results';
            noResultsMsg.innerHTML = '😔 Кормов в этой категории пока нет';
            document.getElementById('foodGrid').appendChild(noResultsMsg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}