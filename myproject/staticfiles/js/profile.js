// Получение CSRF токена
function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Загрузка данных профиля
function loadProfileData() {
    fetch('/profile/api/data/', {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        updateProfileDisplay(data);
        updateSubscriptionInfo(data);
    })
    .catch(error => {
        console.error('Error loading profile data:', error);
        document.getElementById('subscriptionInfo').innerHTML = 
            '<p style="color: #f44336;">Ошибка загрузки данных подписки</p>';
    });
}

// Обновление отображения профиля
function updateProfileDisplay(data) {
    const user = data.user;
    const stats = data.stats;
    
    // Обновляем информацию о пользователе
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileFullName').textContent = user.full_name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profilePhone').textContent = user.phone || 'Не указан';
    document.getElementById('profileAddress').textContent = user.address || 'Не указан';
    document.getElementById('profileJoinDate').textContent = `Зарегистрирован: ${user.joined_date}`;
    
    // Обновляем статистику
    document.getElementById('horsesCount').textContent = stats.horses_count;
    document.getElementById('ordersCount').textContent = stats.orders_count;
    document.getElementById('yearsCount').textContent = stats.years_count;
    document.getElementById('totalSpent').textContent = `${stats.total_spent.toFixed(2)} ₽`;
    document.getElementById('totalSavings').textContent = `${stats.total_savings.toFixed(2)} ₽`;
    document.getElementById('userRating').textContent = stats.rating;
    
    // Обновляем лошадей
    updateHorsesList(data.horses);
    
    // Обновляем заказы
    updateOrdersList(data.orders);
}

// Обновление информации о подписке
function updateSubscriptionInfo(data) {
    const user = data.user;
    const subscriptionInfo = document.getElementById('subscriptionInfo');
    const subscriptionStatus = document.getElementById('subscriptionStatus');
    const subscriptionActions = document.getElementById('subscriptionActions');
    
    if (!user.is_premium) {
        subscriptionInfo.innerHTML = `
            <div class="subscription-card free">
                <div class="subscription-header">
                    <h3>${user.subscription_display}</h3>
                    <span class="subscription-badge">Текущая</span>
                </div>
                <p>Базовые возможности</p>
                <ul class="subscription-features">
                    <li>✓ Доступ к каталогу кормов</li>
                    <li>✓ Просмотр услуг</li>
                    <li>✗ Скидки на корма</li>
                    <li>✗ Бесплатная доставка</li>
                </ul>
                <div class="subscription-price">Бесплатно</div>
            </div>
        `;
        
        subscriptionStatus.innerHTML = `
            <p>Вы используете бесплатную версию. Обновите подписку для получения дополнительных возможностей!</p>
            <div class="subscription-upgrade-options">
                <button class="btn-upgrade" onclick="upgradeSubscription('premium')">
                    Перейти на Конник - 990 ₽/мес
                </button>
                <button class="btn-upgrade pro" onclick="upgradeSubscription('pro')">
                    Перейти на Спортсмен - 2490 ₽/мес
                </button>
            </div>
        `;
    } else {
        const isPro = user.subscription === 'pro';
        const features = isPro ? [
            '✓ Все возможности Конник',
            '✓ Скидка 20% на все корма',
            '✓ Бесплатная доставка от 1500 ₽',
            '✓ Персональный менеджер',
            '✓ Консультации ветеринара'
        ] : [
            '✓ Скидка 10% на все корма',
            '✓ Бесплатная доставка от 2000 ₽',
            '✓ Приоритетная поддержка',
            '✓ Доступ к эксклюзивным товарам'
        ];
        
        subscriptionInfo.innerHTML = `
            <div class="subscription-card ${user.subscription}">
                <div class="subscription-header">
                    <h3>${user.subscription_display}</h3>
                    <span class="subscription-badge active">Активна</span>
                </div>
                <p>${isPro ? 'Максимальные возможности' : 'Расширенные возможности'}</p>
                <ul class="subscription-features">
                    ${features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <div class="subscription-price">${isPro ? '2490 ₽/мес' : '990 ₽/мес'}</div>
            </div>
        `;
        
        subscriptionStatus.innerHTML = `
            <p>Ваша подписка активна. Доступно до ${new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('ru-RU')}</p>
            <button class="btn-cancel" onclick="cancelSubscription()">
                Отменить подписку
            </button>
        `;
    }
}

// Обновление списка лошадей
function updateHorsesList(horses) {
    const container = document.getElementById('horsesList');
    if (horses.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <p>У вас пока нет лошадей</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    horses.forEach(horse => {
        html += `
            <div class="horse-card">
                <div class="horse-avatar">🐎</div>
                <div class="horse-info">
                    <h4>${horse.name}</h4>
                    <p>Порода: ${horse.breed}</p>
                    <p>Возраст: ${horse.age} лет</p>
                    ${horse.color ? `<p>Масть: ${horse.color}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Обновление списка заказов
function updateOrdersList(orders) {
    const container = document.getElementById('ordersList');
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <p>У вас пока нет заказов</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    orders.forEach(order => {
        const statusClass = `status-${order.status_class}`;
        html += `
            <div class="order-card">
                <div class="order-header">
                    <h4>Заказ #${order.order_number}</h4>
                    <span class="order-status ${statusClass}">${order.status}</span>
                </div>
                <div class="order-details">
                    <p>Дата: ${order.date}</p>
                    <p>Товаров: ${order.items_count}</p>
                    <p class="order-total">Сумма: ${order.total.toFixed(2)} ₽</p>
                </div>
                <button class="btn-order-details" onclick="viewOrderDetails('${order.id}')">
                    Подробнее
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Добавление новой лошади
function addNewHorse() {
    const name = prompt('Введите имя лошади:');
    if (!name || name.trim() === '') {
        alert('Имя лошади обязательно');
        return;
    }
    
    const breed = prompt('Выберите породу:\n1. Ахалтекинская\n2. Арабская\n3. Орловский рысак\n4. Тракененская\n5. Будённовская\n6. Донская\n7. Цыганская (тинкер)\n8. Другая порода\n\nВведите номер:', '8');
    
    const breedMap = {
        '1': 'ahaltekin',
        '2': 'arab',
        '3': 'orlov',
        '4': 'trakenen',
        '5': 'budyonny',
        '6': 'don',
        '7': 'tinker',
        '8': 'other'
    };
    
    const selectedBreed = breedMap[breed] || 'other';
    
    const age = prompt('Введите возраст лошади (лет):', '5');
    const color = prompt('Введите масть лошади (опционально):', '');
    const description = prompt('Введите описание лошади (опционально):', '');
    
    const horseData = {
        name: name.trim(),
        breed: selectedBreed,
        age: parseInt(age) || 5,
        color: color.trim(),
        description: description.trim()
    };
    
    fetch('/profile/api/add-horse/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(horseData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            loadProfileData(); // Перезагружаем данные
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка добавления лошади');
    });
}

// Обновление подписки
function upgradeSubscription(subscriptionType) {
    if (!confirm(`Вы уверены, что хотите перейти на подписку "${subscriptionType === 'premium' ? 'Конник' : 'Спортсмен'}"?`)) {
        return;
    }
    
    fetch('/profile/api/subscription/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            subscription_type: subscriptionType
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            loadProfileData(); // Перезагружаем данные
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка обновления подписки');
    });
}

// Отмена подписки
function cancelSubscription() {
    if (!confirm('Вы уверены, что хотите отменить подписку? Вы потеряете все привилегии.')) {
        return;
    }
    
    fetch('/profile/api/subscription/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            subscription_type: 'free'
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Подписка отменена');
            loadProfileData(); // Перезагружаем данные
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка отмены подписки');
    });
}

// Выход из системы
function logout() {
    if (!confirm('Вы уверены, что хотите выйти?')) {
        return;
    }
    
    fetch('/profile/api/logout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            window.location.href = data.redirect_url || '/';
        } else {
            alert('Ошибка выхода: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка выхода из системы');
    });
}

// Просмотр деталей заказа
function viewOrderDetails(orderId) {
    window.location.href = `/cart/order-success/${orderId}/`;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные профиля
    loadProfileData();
    
    // Назначаем обработчики кнопок
    const addHorseBtn = document.getElementById('addHorseBtn');
    if (addHorseBtn) {
        addHorseBtn.addEventListener('click', addNewHorse);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Обновляем информацию о подписке каждые 30 секунд
    setInterval(loadProfileData, 30000);
});