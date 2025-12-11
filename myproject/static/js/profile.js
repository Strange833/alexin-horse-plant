// backend/static/js/profile.js

document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные профиля при загрузке страницы
    loadProfileData();
    
    // Обработчик кнопки выхода
    setupLogoutButton();
    
    // Обработчик добавления лошади
    setupAddHorseButton();
    
    // Обработчик модального окна
    setupHorseModal();
    
    // Автоматическое обновление каждые 30 секунд
    setInterval(loadProfileData, 30000);
});

function loadProfileData() {
    console.log('Загрузка данных профиля...');
    
    fetch('/profile/api/data/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Данные получены:', data);
            
            // Обновляем основную информацию пользователя
            updateUserInfo(data.user);
            
            // Обновляем статистику
            updateStats(data.stats);
            
            // Обновляем секцию подписки
            updateSubscriptionSection(data.user);
            
            // Обновляем секцию лошадей
            updateHorsesSection(data.horses);
            
            // Обновляем секцию заказов
            updateOrdersSection(data.orders);
            
            // Обновляем счетчик корзины в шапке
            updateCartCount(data.stats.cart_items_count);
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных профиля:', error);
            showError('Не удалось загрузить данные профиля. Пожалуйста, обновите страницу.');
        });
}

function updateUserInfo(userData) {
    // Обновляем информацию пользователя в боковой панели
    const elements = {
        'profileUsername': userData.username,
        'profileEmail': userData.email,
        'profileFullName': userData.full_name,
        'profilePhone': userData.phone || 'Телефон не указан',
        'profileAddress': userData.address || 'Адрес не указан',
        'profileJoinDate': `Зарегистрирован: ${userData.joined_date}`
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

function updateStats(stats) {
    // Форматируем числа с разделителями
    const formatNumber = (num) => {
        return new Intl.NumberFormat('ru-RU').format(num);
    };
    
    const formatCurrency = (num) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(num);
    };
    
    const elements = {
        'horsesCount': stats.horses_count,
        'ordersCount': stats.orders_count,
        'yearsCount': stats.years_count,
        'totalSpent': formatCurrency(stats.total_spent),
        'totalSavings': formatCurrency(stats.total_savings),
        'userRating': stats.rating
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
}

function updateSubscriptionSection(userData) {
    const subscriptionContainer = document.getElementById('subscriptionContainer');
    if (!subscriptionContainer) return;
    
    let subscriptionHtml = '';
    
    const subscriptionTypes = {
        'free': {
            name: 'Любитель',
            icon: '⭐',
            color: 'free',
            price: 'Бесплатно',
            features: [
                'Доступ к базовому каталогу кормов',
                'Покупки по стандартным ценам',
                'История заказов',
                'До 3 лошадей в профиле'
            ]
        },
        'premium': {
            name: 'Конник',
            icon: '💎',
            color: 'premium',
            price: '990₽/месяц',
            features: [
                'Скидка 10% на все корма',
                'Приоритетная поддержка',
                'Бесплатная доставка от 2000₽',
                'До 10 лошадей в профиле',
                'Персональный менеджер'
            ]
        },
        'pro': {
            name: 'Спортсмен',
            icon: '🏆',
            color: 'pro',
            price: '1990₽/месяц',
            features: [
                'Скидка 20% на все корма',
                'Экспресс-доставка 24/7',
                'Персональные рекомендации',
                'Неограниченное количество лошадей',
                'Консультации ветеринара',
                'Тренировочные программы'
            ]
        }
    };
    
    const sub = subscriptionTypes[userData.subscription] || subscriptionTypes.free;
    const statusClass = userData.subscription_active ? 'status-active' : 'status-inactive';
    const statusText = userData.subscription_active ? 'Активна' : 'Не активна';
    
    if (userData.subscription_active) {
        // Активная подписка
        subscriptionHtml = `
            <div class="subscription-card ${sub.color} active">
                <div class="subscription-header">
                    <span class="subscription-icon">${sub.icon}</span>
                    <h3>${sub.name}</h3>
                </div>
                <div class="subscription-status ${statusClass}">${statusText}</div>
                <p><strong>Стоимость:</strong> ${sub.price}</p>
                <p><strong>Ваши преимущества:</strong></p>
                <ul class="subscription-features">
                    ${sub.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
                <div class="subscription-actions">
                    <button class="btn-upgrade free" onclick="changeSubscription('free')">
                        Перейти на Любитель
                    </button>
                    <button class="btn-upgrade premium" onclick="changeSubscription('premium')">
                        Перейти на Конник
                    </button>
                    <button class="btn-upgrade pro" onclick="changeSubscription('pro')">
                        Перейти на Спортсмен
                    </button>
                </div>
            </div>
        `;
    } else {
        // Неактивная подписка
        subscriptionHtml = `
            <div class="subscription-card inactive">
                <div class="subscription-header">
                    <span class="subscription-icon">⚠️</span>
                    <h3>Подписка не активна</h3>
                </div>
                <div class="subscription-status status-inactive">Не активна</div>
                <p>У вас нет активной подписки. Выберите тариф, чтобы получить доступ к премиум-функциям:</p>
                <div class="subscription-actions">
                    <button class="btn-upgrade free" onclick="changeSubscription('free')">
                        ⭐ Любитель (Бесплатно)
                    </button>
                    <button class="btn-upgrade premium" onclick="changeSubscription('premium')">
                        💎 Конник - 990₽/мес
                    </button>
                    <button class="btn-upgrade pro" onclick="changeSubscription('pro')">
                        🏆 Спортсмен - 1990₽/мес
                    </button>
                </div>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
                    💡 <strong>Совет:</strong> Подписка "Конник" окупается при заказах от 5000₽ в месяц
                </p>
            </div>
        `;
    }
    
    subscriptionContainer.innerHTML = subscriptionHtml;
}

function updateHorsesSection(horses) {
    const horsesContainer = document.getElementById('horsesContainer');
    if (!horsesContainer) return;
    
    if (horses.length === 0) {
        horsesContainer.innerHTML = `
            <div class="no-horses">
                <p style="font-size: 1.2rem; margin-bottom: 1rem;">🐎 У вас пока нет лошадей</p>
                <p style="color: #666; margin-bottom: 2rem;">Добавьте свою первую лошадь, чтобы получать персонализированные рекомендации</p>
                <button class="btn-upgrade premium" onclick="showAddHorseModal()">
                    + Добавить первую лошадь
                </button>
            </div>
        `;
        return;
    }
    
    let horsesHtml = '<div class="horses-grid">';
    
    horses.forEach(horse => {
        horsesHtml += `
            <div class="horse-card">
                <div class="horse-header">
                    <h4 class="horse-name">${horse.name}</h4>
                    <span class="horse-breed">${horse.breed}</span>
                </div>
                <div class="horse-details">
                    <div class="horse-detail-item">
                        <span class="horse-detail-label">Возраст:</span>
                        <span class="horse-detail-value">${horse.age} лет</span>
                    </div>
                    <div class="horse-detail-item">
                        <span class="horse-detail-label">Масть:</span>
                        <span class="horse-detail-value">${horse.color || 'Не указана'}</span>
                    </div>
                </div>
                ${horse.description ? `<p style="margin-top: 1rem; color: #555;">${horse.description}</p>` : ''}
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn-upgrade free" style="padding: 0.3rem 0.8rem; font-size: 0.9rem;">
                        ✏️ Редактировать
                    </button>
                    <button class="btn-cancel" style="padding: 0.3rem 0.8rem; font-size: 0.9rem;" onclick="deleteHorse('${horse.id}')">
                        🗑️ Удалить
                    </button>
                </div>
            </div>
        `;
    });
    
    horsesHtml += '</div>';
    horsesContainer.innerHTML = horsesHtml;
}

function updateOrdersSection(orders) {
    const ordersContainer = document.getElementById('ordersContainer');
    if (!ordersContainer) return;
    
    if (orders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="no-horses" style="padding: 2rem;">
                <p style="font-size: 1.2rem; margin-bottom: 1rem;">📦 У вас пока нет заказов</p>
                <p style="color: #666; margin-bottom: 2rem;">Посетите магазин кормов, чтобы сделать первый заказ</p>
                <button class="btn-upgrade premium" onclick="window.location.href='/food/'">
                    🛒 Перейти в магазин
                </button>
            </div>
        `;
        return;
    }
    
    let ordersHtml = `
        <table class="orders-table">
            <thead>
                <tr>
                    <th>Номер заказа</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>Товаров</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    orders.forEach(order => {
        const statusClass = `status-${order.status_class}`;
        
        ordersHtml += `
            <tr>
                <td><strong>${order.order_number}</strong></td>
                <td>${order.created_at}</td>
                <td>${parseFloat(order.total).toLocaleString('ru-RU')} ₽</td>
                <td><span class="order-status ${statusClass}">${order.status}</span></td>
                <td>${order.items_count} шт.</td>
            </tr>
        `;
    });
    
    ordersHtml += `
            </tbody>
        </table>
        <div style="margin-top: 1rem; text-align: center;">
            <button class="btn-upgrade free" onclick="window.location.href='/cart/'">
                📋 Вся история заказов
            </button>
        </div>
    `;
    
    ordersContainer.innerHTML = ordersHtml;
}

function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (confirm('Вы действительно хотите выйти из системы?')) {
            // Получаем CSRF токен
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            // Показываем индикатор загрузки
            logoutBtn.innerHTML = '🚪 Выход...';
            logoutBtn.disabled = true;
            
            fetch('/profile/api/logout/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify({}),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Перенаправляем на главную страницу
                    window.location.href = data.redirect_url || '/';
                } else {
                    alert('Ошибка при выходе: ' + data.message);
                    logoutBtn.innerHTML = '🚪 Выйти из системы';
                    logoutBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Ошибка при выходе из системы');
                logoutBtn.innerHTML = '🚪 Выйти из системы';
                logoutBtn.disabled = false;
            });
        }
    });
}

function setupAddHorseButton() {
    const addHorseBtn = document.getElementById('addHorseBtn');
    if (!addHorseBtn) return;
    
    addHorseBtn.addEventListener('click', showAddHorseModal);
}

function setupHorseModal() {
    const modal = document.getElementById('addHorseModal');
    const closeBtn = document.getElementById('closeHorseModal');
    const cancelBtn = document.getElementById('cancelHorseBtn');
    const form = document.getElementById('addHorseForm');
    
    // Закрытие модального окна
    if (closeBtn) {
        closeBtn.addEventListener('click', hideAddHorseModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideAddHorseModal);
    }
    
    // Закрытие при клике вне модального окна
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                hideAddHorseModal();
            }
        });
    }
    
    // Обработка отправки формы
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAddHorseForm();
        });
    }
    
    // Закрытие по клавише ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAddHorseModal();
        }
    });
}

function showAddHorseModal() {
    const modal = document.getElementById('addHorseModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Блокируем скролл
    }
}

function hideAddHorseModal() {
    const modal = document.getElementById('addHorseModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Разблокируем скролл
        
        // Очищаем форму
        const form = document.getElementById('addHorseForm');
        if (form) {
            form.reset();
        }
    }
}

function submitAddHorseForm() {
    const form = document.getElementById('addHorseForm');
    if (!form) return;
    
    const horseName = document.getElementById('horseName').value.trim();
    const horseBreed = document.getElementById('horseBreed').value;
    const horseAge = document.getElementById('horseAge').value;
    const horseColor = document.getElementById('horseColor').value.trim();
    const horseDescription = document.getElementById('horseDescription').value.trim();
    
    // Валидация
    if (!horseName) {
        alert('Пожалуйста, введите имя лошади');
        return;
    }
    
    if (!horseBreed) {
        alert('Пожалуйста, выберите породу');
        return;
    }
    
    if (!horseAge || horseAge < 1 || horseAge > 40) {
        alert('Возраст должен быть от 1 до 40 лет');
        return;
    }
    
    const submitBtn = document.getElementById('submitHorseBtn');
    const originalText = submitBtn.innerHTML;
    
    // Показываем индикатор загрузки
    submitBtn.innerHTML = '🐎 Добавление...';
    submitBtn.disabled = true;
    
    // Получаем CSRF токен
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // Отправляем данные на сервер
    fetch('/profile/api/add-horse/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            name: horseName,
            breed: horseBreed,
            age: parseInt(horseAge),
            color: horseColor,
            description: horseDescription
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Закрываем модальное окно
            hideAddHorseModal();
            
            // Показываем уведомление
            showSuccess('Лошадь успешно добавлена!');
            
            // Обновляем данные профиля
            setTimeout(loadProfileData, 500);
        } else {
            alert('Ошибка: ' + data.message);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка при добавлении лошади');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

function changeSubscription(subscriptionType) {
    if (!confirm(`Вы уверены, что хотите изменить подписку на "${subscriptionType}"?`)) {
        return;
    }
    
    // Получаем CSRF токен
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/profile/api/subscription/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            subscription_type: subscriptionType
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Подписка успешно изменена!');
            
            // Обновляем данные профиля
            setTimeout(loadProfileData, 1000);
            
            // Прокручиваем к секции подписки
            const subscriptionSection = document.getElementById('subscription');
            if (subscriptionSection) {
                subscriptionSection.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка при изменении подписки');
    });
}

function deleteHorse(horseId) {
    if (!confirm('Вы уверены, что хотите удалить эту лошадь?')) {
        return;
    }
    
    // Получаем CSRF токен
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/profile/api/delete-horse/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            horse_id: horseId
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccess('Лошадь успешно удалена!');
            
            // Обновляем данные профиля
            setTimeout(loadProfileData, 500);
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении лошади');
    });
}

function updateCartCount(count) {
    const cartCountElement = document.getElementById('cartCount');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

function showSuccess(message) {
    // Создаем элемент для уведомления
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        ">
            ✅ ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 5px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        ">
            ❌ ${message}
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
// ============ ФУНКЦИИ РЕДАКТИРОВАНИЯ ПРОФИЛЯ ============

function setupEditProfile() {
    const editBtn = document.getElementById('editProfileBtn');
    const editModal = document.getElementById('editProfileModal');
    const closeEditBtn = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('editProfileForm');
    
    // Открытие модального окна
    if (editBtn) {
        editBtn.addEventListener('click', showEditProfileModal);
    }
    
    // Закрытие модального окна
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', hideEditProfileModal);
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', hideEditProfileModal);
    }
    
    // Закрытие при клике вне модального окна
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) {
                hideEditProfileModal();
            }
        });
    }
    
    // Обработка отправки формы
    if (editForm) {
        editForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitEditProfileForm();
        });
    }
}

function showEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        // Заполняем форму текущими данными
        const firstName = document.getElementById('editFirstName');
        const lastName = document.getElementById('editLastName');
        const phone = document.getElementById('editPhone');
        const email = document.getElementById('editEmail');
        const address = document.getElementById('editAddress');
        
        // Можете заполнить автоматически, если нужно
        // или оставить текущие значения из шаблона
        
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function submitEditProfileForm() {
    const firstName = document.getElementById('editFirstName').value.trim();
    const lastName = document.getElementById('editLastName').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const address = document.getElementById('editAddress').value.trim();
    
    // Валидация email
    if (email && !validateEmail(email)) {
        alert('Пожалуйста, введите корректный email адрес');
        return;
    }
    
    const saveBtn = document.getElementById('saveProfileBtn');
    const originalText = saveBtn.innerHTML;
    
    // Показываем индикатор загрузки
    saveBtn.innerHTML = '💾 Сохранение...';
    saveBtn.disabled = true;
    
    // Получаем CSRF токен
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    // Отправляем данные на сервер
    fetch('/profile/api/update/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            email: email,
            address: address
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Закрываем модальное окно
            hideEditProfileModal();
            
            // Показываем уведомление
            showSuccess('Профиль успешно обновлен!');
            
            // Обновляем данные на странице
            updateProfileDisplay(data.user);
            
            // Перезагружаем данные профиля
            setTimeout(loadProfileData, 500);
        } else {
            alert('Ошибка: ' + data.message);
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        alert('Ошибка при обновлении профиля');
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    });
}

function updateProfileDisplay(userData) {
    // Обновляем информацию на странице
    const fullNameElement = document.getElementById('profileFullName');
    const phoneElement = document.getElementById('profilePhone');
    const addressElement = document.getElementById('profileAddress');
    
    if (fullNameElement) {
        const fullName = (userData.first_name + ' ' + userData.last_name).trim();
        fullNameElement.textContent = fullName || userData.username;
    }
    
    if (phoneElement) {
        phoneElement.textContent = userData.phone || 'Телефон не указан';
    }
    
    if (addressElement) {
        addressElement.textContent = userData.address || 'Адрес не указан';
    }
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ============ ОБНОВЛЕННАЯ ФУНКЦИЯ INIT ============

document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные профиля при загрузке страницы
    loadProfileData();
    
    // Обработчик кнопки выхода
    setupLogoutButton();
    
    // Обработчик редактирования профиля
    setupEditProfile();
    
    // Обработчик добавления лошади
    setupAddHorseButton();
    
    // Обработчик модального окна лошади
    setupHorseModal();
    
    // Автоматическое обновление каждые 30 секунд
    setInterval(loadProfileData, 30000);
    
    // Закрытие по клавише ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideEditProfileModal();
            hideAddHorseModal();
        }
    });
});