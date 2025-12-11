// Основные переменные
let cartData = null;
let deliveryCost = 0;
let discount = 0;
let assemblyCost = 0;
let currentStep = 'cart';
let promoCodeApplied = false;

// Получение CSRF токена
function getCSRFToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// Загрузка данных корзины
function loadCartData() {
    fetch('/cart/api/data/', {
        method: 'GET',
        headers: {
            'X-CSRFToken': getCSRFToken()
        }
    })
    .then(response => response.json())
    .then(data => {
        cartData = data;
        updateCartDisplay();
        updateCartCount(data.total_items);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Обновление отображения корзины
function updateCartDisplay() {
    if (!cartData) return;
    
    const container = document.getElementById('cartItemsContainer');
    const emptyCart = document.getElementById('emptyCart');
    const checkoutButton = document.getElementById('checkoutButton');
    
    if (cartData.items.length === 0) {
        container.innerHTML = '';
        emptyCart.style.display = 'block';
        checkoutButton.disabled = true;
        updateSummary();
        return;
    }
    
    emptyCart.style.display = 'none';
    checkoutButton.disabled = false;
    
    let html = '';
    cartData.items.forEach(item => {
        html += `
            <div class="cart-item" data-id="${item.id}">
                <img src="${item.image_url || '/static/images/food_default.jpg'}" 
                     alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-specs">${item.unit}</div>
                    <div class="cart-item-price">${item.price} ₽ × ${item.quantity} = ${item.total} ₽</div>
                    <div class="stock-status stock-in-stock">В наличии</div>
                    <div class="cart-item-controls">
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" readonly>
                            <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})" ${item.quantity >= 10 ? 'disabled' : ''}>+</button>
                        </div>
                        <div class="item-actions">
                            <button class="btn-action" onclick="addToFavorites('${item.id}')">
                                ❤️ В избранное
                            </button>
                            <button class="btn-action btn-remove" onclick="removeFromCart('${item.id}')">
                                🗑️ Удалить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    updateSummary();
    updateCheckoutSummary();
    
    // Обновляем сведения о подписке
    updateSubscriptionInfo();
}

// Обновление количества товара
function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) newQuantity = 1;
    if (newQuantity > 10) newQuantity = 10;
    
    fetch('/cart/api/update/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            item_id: itemId,
            quantity: newQuantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadCartData();
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка обновления количества');
    });
}

// Удаление товара из корзины
function removeFromCart(itemId) {
    if (!confirm('Удалить товар из корзины?')) return;
    
    fetch('/cart/api/remove/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify({
            item_id: itemId
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadCartData();
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка удаления товара');
    });
}

// Обновление сводки
function updateSummary() {
    if (!cartData) return;
    
    document.getElementById('itemsCount').textContent = cartData.total_items;
    document.getElementById('subtotal').textContent = cartData.subtotal.toFixed(2) + ' ₽';
    document.getElementById('discount').textContent = '-' + cartData.discount.toFixed(2) + ' ₽';
    document.getElementById('assemblyCost').textContent = cartData.assembly_cost.toFixed(2) + ' ₽';
    document.getElementById('deliveryCost').textContent = cartData.delivery_cost.toFixed(2) + ' ₽';
    document.getElementById('totalAmount').textContent = cartData.total.toFixed(2) + ' ₽';
}

// Обновление сводки на шаге оформления
function updateCheckoutSummary() {
    if (!cartData) return;
    
    document.getElementById('checkoutItemsCount').textContent = cartData.total_items;
    document.getElementById('checkoutSubtotal').textContent = cartData.subtotal.toFixed(2) + ' ₽';
    document.getElementById('checkoutDiscount').textContent = '-' + cartData.discount.toFixed(2) + ' ₽';
    document.getElementById('checkoutAssemblyCost').textContent = cartData.assembly_cost.toFixed(2) + ' ₽';
    document.getElementById('checkoutDeliveryCost').textContent = cartData.delivery_cost.toFixed(2) + ' ₽';
    document.getElementById('checkoutTotalAmount').textContent = cartData.total.toFixed(2) + ' ₽';
}

// Обновление счетчика корзины
function updateCartCount(count) {
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = count;
    });
}

// Переход между шагами
function goToStep(step) {
    currentStep = step;
    
    // Скрываем все шаги
    document.querySelectorAll('.checkout-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Показываем нужный шаг
    document.getElementById(step + 'Step').style.display = 'block';
    
    // Обновляем индикатор шагов
    document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active', 'completed'));
    
    if (step === 'cart') {
        document.getElementById('stepCart').classList.add('active');
        document.getElementById('stepCheckout').classList.remove('active');
    } else if (step === 'checkout') {
        document.getElementById('stepCart').classList.add('completed');
        document.getElementById('stepCheckout').classList.add('active');
        
        // Заполняем форму данными пользователя
        if (window.userData) {
            fillUserData();
        }
        
        // Обновляем подтверждение
        updateConfirmationDetails();
    }
}

// Заполнение данных пользователя
function fillUserData() {
    if (!window.userData) return;
    
    const user = window.userData;
    
    // Заполняем поля формы
    if (user.full_name) {
        document.getElementById('customerName').value = user.full_name;
    }
    if (user.phone) {
        document.getElementById('customerPhone').value = user.phone;
    }
    if (user.email) {
        document.getElementById('customerEmail').value = user.email;
    }
    
    // Заполняем адрес
    if (user.address) {
        document.getElementById('deliveryCity').value = user.address.city || '';
        document.getElementById('deliveryStreet').value = user.address.street || '';
        document.getElementById('deliveryHouse').value = user.address.house || '';
        document.getElementById('deliveryApartment').value = user.address.apartment || '';
        document.getElementById('deliveryIndex').value = user.address.index || '';
    }
    
    // Обновляем подтверждение
    updateConfirmationDetails();
    
    // Показываем панель пользователя
    const userInfoPanel = document.getElementById('userInfoPanel');
    if (userInfoPanel) {
        userInfoPanel.classList.add('active');
        
        // Заполняем детали
        const userDetails = document.getElementById('userDetails');
        if (userDetails) {
            userDetails.innerHTML = `
                <div class="user-detail-item">
                    <strong>ФИО:</strong><br>
                    ${user.full_name || 'Не указано'}
                </div>
                <div class="user-detail-item">
                    <strong>Телефон:</strong><br>
                    ${user.phone || 'Не указано'}
                </div>
                <div class="user-detail-item">
                    <strong>Email:</strong><br>
                    ${user.email || 'Не указан'}
                </div>
                ${user.address ? `
                <div class="user-detail-item">
                    <strong>Адрес:</strong><br>
                    ${user.address.city || ''}, ${user.address.street || ''}, д. ${user.address.house || ''}
                </div>
                ` : ''}
            `;
        }
    }
}

// Обновление информации о подписке
function updateSubscriptionInfo() {
    if (!window.userData || !cartData) return;
    
    const subscription = window.userData.subscription;
    const savingsBlock = document.getElementById('savingsBlock');
    const upgradeOffer = document.getElementById('upgradeOffer');
    
    if (subscription !== 'free' && cartData.discount > 0) {
        if (savingsBlock) {
            savingsBlock.style.display = 'block';
            
            let savingsHTML = `
                <div class="savings-item">
                    <span>Скидка по подписке</span>
                    <span>-${cartData.discount.toFixed(2)} ₽</span>
                </div>
            `;
            
            // Добавляем информацию о доставке
            if (cartData.delivery_cost === 0 && cartData.subtotal >= 2000) {
                savingsHTML += `
                    <div class="savings-item">
                        <span>Бесплатная доставка</span>
                        <span>-500 ₽</span>
                    </div>
                `;
            }
            
            savingsHTML += `
                <div class="savings-total">
                    <span>Общая экономия</span>
                    <span>-${(cartData.discount + (cartData.delivery_cost === 0 ? 500 : 0)).toFixed(2)} ₽</span>
                </div>
            `;
            
            savingsBlock.querySelector('#savingsDetails').innerHTML = savingsHTML;
        }
        
        // Показываем предложение апгрейда для premium
        if (subscription === 'premium' && upgradeOffer) {
            const potentialSavings = cartData.subtotal * 0.10; // Дополнительные 10%
            upgradeOffer.style.display = 'block';
            upgradeOffer.querySelector('#upgradeSavings').innerHTML = 
                `Дополнительная экономия: ${potentialSavings.toFixed(2)} ₽`;
        }
    } else if (savingsBlock) {
        savingsBlock.style.display = 'none';
    }
    
    if (upgradeOffer && subscription !== 'premium') {
        upgradeOffer.style.display = 'none';
    }
}

// Применение промокода
function applyPromoCode() {
    const promoCode = document.getElementById('promoCode').value || 
                     document.getElementById('checkoutPromoCode').value;
    
    if (!promoCode) {
        alert('Введите промокод');
        return;
    }
    
    // Здесь можно добавить логику проверки промокода
    if (promoCode === 'AKZ2024') {
        alert('Промокод применен! Скидка 10%');
        // Обновить данные корзины с учетом промокода
    } else if (promoCode === 'FREE500') {
        alert('Промокод применен! Скидка 500 ₽');
        // Обновить данные корзины с учетом промокода
    } else {
        alert('Промокод недействителен');
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем данные корзины
    loadCartData();
    
    // Загружаем данные пользователя
    fetch('/api/user-info/')
        .then(response => response.json())
        .then(data => {
            if (data.is_authenticated) {
                window.userData = {
                    full_name: `${data.first_name} ${data.last_name}`.trim() || data.username,
                    phone: data.phone || '',
                    email: data.email || '',
                    subscription: data.subscription || 'free',
                    address: {
                        city: data.address || '',
                        street: '',
                        house: '',
                        apartment: '',
                        index: ''
                    }
                };
            }
        })
        .catch(error => {
            console.error('Error loading user data:', error);
        });
    
    // Инициализация меню
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('menu-open');
            } else {
                document.body.classList.remove('menu-open');
            }
        });
    }
    
    // Инициализация доставки и оплаты
    document.querySelectorAll('.delivery-radio').forEach(radio => {
        radio.addEventListener('change', updateDeliverySelection);
    });
    
    document.querySelectorAll('.payment-radio').forEach(radio => {
        radio.addEventListener('change', updatePaymentSelection);
    });
    
    // Инициализация валидации
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this.id);
        });
    });
    
    // Форматирование телефона
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            formatPhoneNumber(e.target);
        });
    }
});

// Оформление заказа
function processCheckout() {
    // Собираем данные формы
    const formData = {
        customer_name: document.getElementById('customerName').value,
        customer_phone: document.getElementById('customerPhone').value,
        customer_email: document.getElementById('customerEmail').value,
        delivery_city: document.getElementById('deliveryCity').value,
        delivery_street: document.getElementById('deliveryStreet').value,
        delivery_house: document.getElementById('deliveryHouse').value,
        delivery_apartment: document.getElementById('deliveryApartment').value,
        delivery_index: document.getElementById('deliveryIndex').value,
        delivery_method: document.querySelector('input[name="delivery"]:checked').value,
        payment_method: document.querySelector('input[name="payment"]:checked').value,
        promo_code: document.getElementById('checkoutPromoCode').value,
        agree_terms: document.getElementById('agreeTerms').checked
    };
    
    // Проверяем обязательные поля
    const requiredFields = ['customerName', 'customerPhone', 'deliveryCity', 'deliveryStreet', 'deliveryHouse'];
    let isValid = true;
    
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field.value.trim()) {
            field.closest('.form-group').classList.add('error');
            isValid = false;
        }
    });
    
    if (!isValid) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (!formData.agree_terms) {
        alert('Необходимо согласие с условиями обработки персональных данных');
        return;
    }
    
    // Отправляем заказ
    fetch('/cart/api/checkout/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCSRFToken()
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Показываем модальное окно успеха
            showSuccessModal(data);
        } else {
            alert('Ошибка: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ошибка оформления заказа');
    });
}

// Показ модального окна успеха
function showSuccessModal(data) {
    const modal = document.getElementById('successModal');
    const orderItems = document.getElementById('modalOrderItems');
    
    // Заполняем детали
    document.getElementById('modalOrderNumber').textContent = data.order_number;
    document.getElementById('modalOrderDate').textContent = new Date().toLocaleDateString('ru-RU');
    document.getElementById('modalOrderTotal').textContent = data.total.toFixed(2) + ' ₽';
    
    // Заполняем товары
    if (cartData) {
        orderItems.innerHTML = '';
        cartData.items.forEach(item => {
            orderItems.innerHTML += `
                <div class="order-item">
                    <span>${item.name} × ${item.quantity}</span>
                    <span>${item.total.toFixed(2)} ₽</span>
                </div>
            `;
        });
    }
    
    modal.classList.add('active');
}

