let currentStep = 'cart';

document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    updateDeliverySelection();
    updatePaymentSelection();
    updateConfirmationDetails();
    displaySavings();
    
    // Заполняем данные пользователя если авторизован
    if (document.getElementById('userInfoPanel').classList.contains('active')) {
        fillUserData();
    }
});

function setupEventListeners() {
    // Обработчики для способов доставки
    document.querySelectorAll('.delivery-radio').forEach(radio => {
        radio.addEventListener('change', function() {
            updateDeliverySelection();
            updateDeliveryCost();
            updateConfirmationDetails();
        });
    });

    // Обработчики для способов оплаты
    document.querySelectorAll('.payment-radio').forEach(radio => {
        radio.addEventListener('change', function() {
            updatePaymentSelection();
            updateConfirmationDetails();
        });
    });

    // Обработчики для полей формы
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', function() {
            updateConfirmationDetails();
            validateField(this.id);
        });
        
        input.addEventListener('blur', function() {
            validateField(this.id);
        });
    });

    // Обработчик для телефона - форматирование
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            formatPhoneNumber(e.target);
        });
    }
}

// Данные о товарах в корзине
        let cartItems = JSON.parse(localStorage.getItem('horseCart')) || {};
        let deliveryCost = 0;
        let discount = 0;
        let assemblyCost = 0; // Стоимость сборки товара

        // Данные пользователя (в реальном приложении получаются из базы данных)
        const userData = {
            isLoggedIn: localStorage.getItem('userLoggedIn') === 'true',
            profile: JSON.parse(localStorage.getItem('userProfile')) || {
                fullName: 'Иванов Иван Иванович',
                phone: '+7 (900) 123-45-67',
                email: 'ivanov@example.com',
                address: {
                    city: 'г. Алексин',
                    street: 'ул. Конная',
                    house: '15',
                    apartment: '25',
                    index: '301360'
                },
                preferredDelivery: 'courier',
                preferredPayment: 'card'
            }
        };

        // Рекомендуемые товары
        const recommendations = [
            {
                id: 7,
                name: "Льняное семя",
                price: 450,
                image: "Flax_seeds.jpg",
                specs: "Мешок 5 кг"
            },
            {
                id: 8,
                name: "Солевой лизунец",
                price: 320,
                image: "Salt_lick.jpg",
                specs: "Блок 2 кг"
            },
            {
                id: 9,
                name: "Премикс для жеребят",
                price: 1200,
                image: "Premix_for_foals.webp",
                specs: "Упаковка 3 кг"
            },
            {
                id: 10,
                name: "Травяные гранулы",
                price: 680,
                image: "Herbal_granules.webp",
                specs: "Мешок 15 кг"
            }
        ];

        // Инициализация страницы
        document.addEventListener('DOMContentLoaded', function() {
            updateCartDisplay();
            setupEventListeners();
            updateCartCount();
            loadRecommendations();
            updateDeliveryCost();
            checkUserStatus();
            calculateAssemblyCost(); // Рассчитываем стоимость сборки
            updateConfirmationDetails(); // Обновляем детали подтверждения
            displaySavings(); // Показываем экономию с подпиской
            
            // Обработчик для меню
            const menuToggle = document.getElementById('menuToggle');
            menuToggle.addEventListener('change', function() {
                if (this.checked) {
                    document.body.classList.add('menu-open');
                } else {
                    document.body.classList.remove('menu-open');
                }
            });
        });

        // Проверка статуса пользователя
        function checkUserStatus() {
            const userInfoPanel = document.getElementById('userInfoPanel');
            const userDetails = document.getElementById('userDetails');
            
            if (userData.isLoggedIn) {
                userInfoPanel.classList.add('active');
                
                // Заполняем информацию о пользователе
                userDetails.innerHTML = `
                    <div class="user-detail-item">
                        <strong>ФИО:</strong><br>
                        ${userData.profile.fullName}
                    </div>
                    <div class="user-detail-item">
                        <strong>Телефон:</strong><br>
                        ${userData.profile.phone}
                    </div>
                    <div class="user-detail-item">
                        <strong>Email:</strong><br>
                        ${userData.profile.email}
                    </div>
                    <div class="user-detail-item">
                        <strong>Адрес:</strong><br>
                        ${userData.profile.address.city}, ${userData.profile.address.street}, д. ${userData.profile.address.house}
                    </div>
                `;
            } else {
                userInfoPanel.classList.remove('active');
            }
        }

        // Автозаполнение данных пользователя
        function fillUserData() {
            if (userData.isLoggedIn) {
                document.getElementById('customerName').value = userData.profile.fullName;
                document.getElementById('customerPhone').value = userData.profile.phone;
                document.getElementById('customerEmail').value = userData.profile.email;
                document.getElementById('deliveryCity').value = userData.profile.address.city;
                document.getElementById('deliveryStreet').value = userData.profile.address.street;
                document.getElementById('deliveryHouse').value = userData.profile.address.house;
                document.getElementById('deliveryApartment').value = userData.profile.address.apartment || '';
                document.getElementById('deliveryIndex').value = userData.profile.address.index || '';
                
                // Устанавливаем предпочтительный способ доставки и оплаты
                document.querySelector(`input[name="delivery"][value="${userData.profile.preferredDelivery}"]`).checked = true;
                document.querySelector(`input[name="payment"][value="${userData.profile.preferredPayment}"]`).checked = true;
                
                updateDeliverySelection();
                updatePaymentSelection();
                updateDeliveryCost();
                updateConfirmationDetails();
                
                // Валидируем заполненные данные
                validateField('customerName');
                validateField('customerPhone');
                validateField('customerEmail');
                validateField('deliveryCity');
                validateField('deliveryStreet');
                validateField('deliveryHouse');
                validateField('deliveryIndex');
                
                alert('Данные из профиля успешно заполнены!');
            }
        }

        // Обновление отображения корзины
        function updateCartDisplay() {
            const cartItemsContainer = document.getElementById('cartItemsContainer');
            const emptyCart = document.getElementById('emptyCart');
            const subtotalElement = document.getElementById('subtotal');
            const discountElement = document.getElementById('discount');
            const deliveryCostElement = document.getElementById('deliveryCost');
            const totalAmountElement = document.getElementById('totalAmount');
            const itemsCountElement = document.getElementById('itemsCount');
            
            // Очищаем контейнер
            cartItemsContainer.innerHTML = '';
            
            if (Object.keys(cartItems).length === 0) {
                emptyCart.style.display = 'block';
                cartItemsContainer.style.display = 'none';
                updateSummary(0, 0);
                document.getElementById('checkoutButton').disabled = true;
                return;
            }
            
            emptyCart.style.display = 'none';
            cartItemsContainer.style.display = 'block';
            document.getElementById('checkoutButton').disabled = false;
            
            let subtotal = 0;
            let totalItems = 0;
            
            // Добавляем товары в корзину
            Object.values(cartItems).forEach((item, index) => {
                const itemTotal = item.price * item.quantity;
                subtotal += itemTotal;
                totalItems += item.quantity;
                
                const stockStatus = getStockStatus(item.id);
                const statusClass = `stock-${stockStatus.status}`;
                const statusText = stockStatus.text;
                
                const cartItemHTML = `
                    <div class="cart-item" data-id="${item.id}">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                        <div class="cart-item-details">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-specs">${item.specs || 'Мешок 25 кг'}</div>
                            <div class="cart-item-price">${item.price} ₽ × ${item.quantity} = ${itemTotal} ₽</div>
                            <div class="stock-status ${statusClass}">${statusText}</div>
                            <div class="cart-item-controls">
                                <div class="quantity-controls">
                                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="10" readonly>
                                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})" ${item.quantity >= 10 ? 'disabled' : ''}>+</button>
                                </div>
                                <div class="item-actions">
                                    <button class="btn-action" onclick="addToFavorites(${item.id})">
                                        ❤️ В избранное
                                    </button>
                                    <button class="btn-action btn-remove" onclick="removeFromCart(${item.id})">
                                        🗑️ Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                cartItemsContainer.innerHTML += cartItemHTML;
            });
            
            itemsCountElement.textContent = totalItems;
            calculateAssemblyCost(); // Пересчитываем стоимость сборки
            updateSummary(subtotal, discount);
            updateCheckoutSummary();
            updateConfirmationDetails();
        }

        // Расчет стоимости сборки товара
        function calculateAssemblyCost() {
            // Стоимость сборки - 5% от стоимости товаров, но не менее 100 рублей
            const subtotal = calculateSubtotal();
            assemblyCost = Math.max(Math.round(subtotal * 0.05), 100);
            
            // Обновляем отображение стоимости сборки
            document.getElementById('assemblyCost').textContent = `${assemblyCost} ₽`;
            document.getElementById('checkoutAssemblyCost').textContent = `${assemblyCost} ₽`;
        }

        // Получение статуса наличия товара
        function getStockStatus(itemId) {
            const statuses = {
                1: { status: 'in-stock', text: 'В наличии' },
                2: { status: 'low', text: 'Заканчивается' },
                3: { status: 'in-stock', text: 'В наличии' },
                4: { status: 'low', text: 'Заканчивается' },
                5: { status: 'in-stock', text: 'В наличии' },
                6: { status: 'out', text: 'Нет в наличии' }
            };
            return statuses[itemId] || { status: 'in-stock', text: 'В наличии' };
        }

        // Обновление сводки заказа
        function updateSummary(subtotal, discountAmount) {
            const subtotalElement = document.getElementById('subtotal');
            const discountElement = document.getElementById('discount');
            const deliveryCostElement = document.getElementById('deliveryCost');
            const totalAmountElement = document.getElementById('totalAmount');
            
            const total = subtotal - discountAmount + deliveryCost + assemblyCost;
            
            subtotalElement.textContent = `${subtotal} ₽`;
            discountElement.textContent = `-${discountAmount} ₽`;
            deliveryCostElement.textContent = `${deliveryCost} ₽`;
            totalAmountElement.textContent = `${total} ₽`;
        }

        // Обновление сводки на шаге оформления
        function updateCheckoutSummary() {
            const subtotal = calculateSubtotal();
            const total = subtotal - discount + deliveryCost + assemblyCost;
            const totalItems = Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);
            
            document.getElementById('checkoutItemsCount').textContent = totalItems;
            document.getElementById('checkoutSubtotal').textContent = `${subtotal} ₽`;
            document.getElementById('checkoutDiscount').textContent = `-${discount} ₽`;
            document.getElementById('checkoutDeliveryCost').textContent = `${deliveryCost} ₽`;
            document.getElementById('checkoutTotalAmount').textContent = `${total} ₽`;
        }

        // Настройка обработчиков событий
        function setupEventListeners() {
            // Обработчики для способов доставки
            document.querySelectorAll('.delivery-radio').forEach(radio => {
                radio.addEventListener('change', function() {
                    updateDeliverySelection();
                    updateDeliveryCost();
                    updateConfirmationDetails();
                });
            });

            // Обработчики для способов оплаты
            document.querySelectorAll('.payment-radio').forEach(radio => {
                radio.addEventListener('change', function() {
                    updatePaymentSelection();
                    updateConfirmationDetails();
                });
            });

            // Обработчики для полей формы
            document.querySelectorAll('.form-input').forEach(input => {
                input.addEventListener('input', function() {
                    updateConfirmationDetails();
                    validateField(this.id);
                });
                
                input.addEventListener('blur', function() {
                    validateField(this.id);
                });
            });

            // Обработчик для телефона - форматирование
            document.getElementById('customerPhone').addEventListener('input', function(e) {
                formatPhoneNumber(e.target);
            });
        }

        // Форматирование номера телефона
        function formatPhoneNumber(input) {
            // Удаляем все нецифровые символы, кроме +
            let value = input.value.replace(/[^\d+]/g, '');
            
            // Если номер начинается не с +7, добавляем +7
            if (!value.startsWith('+7') && value.length > 0) {
                if (value.startsWith('7') || value.startsWith('8')) {
                    value = '+7' + value.substring(1);
                } else {
                    value = '+7' + value;
                }
            }
            
            // Ограничиваем длину
            if (value.length > 12) {
                value = value.substring(0, 12);
            }
            
            // Форматируем номер
            if (value.length >= 2) {
                let formatted = value.substring(0, 2); // +7
                
                if (value.length > 2) {
                    formatted += ' (' + value.substring(2, 5);
                }
                if (value.length > 5) {
                    formatted += ') ' + value.substring(5, 8);
                }
                if (value.length > 8) {
                    formatted += '-' + value.substring(8, 10);
                }
                if (value.length > 10) {
                    formatted += '-' + value.substring(10, 12);
                }
                
                input.value = formatted;
            } else {
                input.value = value;
            }
        }

        // Валидация поля
        function validateField(fieldId) {
            const field = document.getElementById(fieldId);
            const formGroup = field.closest('.form-group');
            let isValid = true;
            let errorMessage = '';
            
            // Сбрасываем состояние
            formGroup.classList.remove('error', 'success');
            
            // Проверяем в зависимости от типа поля
            switch(fieldId) {
                case 'customerName':
                    isValid = validateName(field.value);
                    errorMessage = 'Пожалуйста, укажите ваше ФИО (минимум 2 слова)';
                    break;
                    
                case 'customerPhone':
                    isValid = validatePhone(field.value);
                    errorMessage = 'Пожалуйста, укажите корректный номер телефона в формате +7 XXX XXX-XX-XX';
                    break;
                    
                case 'customerEmail':
                    if (field.value.trim() !== '') {
                        isValid = validateEmail(field.value);
                        errorMessage = 'Пожалуйста, укажите корректный email адрес';
                    } else {
                        isValid = true; // Email не обязателен
                    }
                    break;
                    
                case 'deliveryCity':
                case 'deliveryStreet':
                case 'deliveryHouse':
                    isValid = field.value.trim() !== '';
                    errorMessage = `Пожалуйста, укажите ${getFieldLabel(fieldId)}`;
                    break;
                    
                case 'deliveryIndex':
                    if (field.value.trim() !== '') {
                        isValid = validatePostalCode(field.value);
                        errorMessage = 'Пожалуйста, укажите корректный почтовый индекс (6 цифр)';
                    } else {
                        isValid = true; // Индекс не обязателен
                    }
                    break;
            }
            
            // Обновляем состояние поля
            if (!isValid && field.value.trim() !== '') {
                formGroup.classList.add('error');
                formGroup.querySelector('.error-message').textContent = errorMessage;
            } else if (isValid && field.value.trim() !== '') {
                formGroup.classList.add('success');
            }
            
            return isValid;
        }

        // Валидация имени (ФИО)
        function validateName(name) {
            const words = name.trim().split(/\s+/);
            return words.length >= 2 && words.every(word => word.length >= 2);
        }

        // Валидация телефона
        function validatePhone(phone) {
            // Убираем все нецифровые символы, кроме +
            const cleanPhone = phone.replace(/[^\d+]/g, '');
            return cleanPhone.startsWith('+7') && cleanPhone.length === 12;
        }

        // Валидация email
        function validateEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        // Валидация почтового индекса
        function validatePostalCode(code) {
            const postalRegex = /^\d{6}$/;
            return postalRegex.test(code.replace(/\s/g, ''));
        }

        // Получение названия поля для ошибки
        function getFieldLabel(fieldId) {
            const labels = {
                'customerName': 'ФИО',
                'customerPhone': 'телефон',
                'deliveryCity': 'город доставки',
                'deliveryStreet': 'улицу',
                'deliveryHouse': 'номер дома'
            };
            return labels[fieldId] || 'это поле';
        }

        // Обновление стоимости доставки
        function updateDeliveryCost() {
            const selectedDelivery = document.querySelector('input[name="delivery"]:checked').value;
            switch(selectedDelivery) {
                case 'courier':
                    deliveryCost = 500;
                    break;
                case 'pickup':
                    deliveryCost = 0;
                    break;
                case 'post':
                    deliveryCost = 300;
                    break;
            }
            const subtotal = calculateSubtotal();
            updateSummary(subtotal, discount);
            updateCheckoutSummary();
        }

        // Обновление выбора доставки
        function updateDeliverySelection() {
            document.querySelectorAll('.delivery-option').forEach(option => {
                const radio = option.querySelector('.delivery-radio');
                if (radio.checked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
            });
        }

        // Обновление выбора оплаты
        function updatePaymentSelection() {
            document.querySelectorAll('.payment-method').forEach(method => {
                const radio = method.querySelector('.payment-radio');
                if (radio.checked) {
                    method.classList.add('selected');
                } else {
                    method.classList.remove('selected');
                }
            });
        }

        // Расчет общей стоимости товаров
        function calculateSubtotal() {
            return Object.values(cartItems).reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        // Обновление количества товара
        function updateQuantity(itemId, newQuantity) {
            if (newQuantity < 1) newQuantity = 1;
            if (newQuantity > 10) newQuantity = 10;
            
            if (cartItems[itemId]) {
                cartItems[itemId].quantity = newQuantity;
                localStorage.setItem('horseCart', JSON.stringify(cartItems));
                updateCartDisplay();
                updateCartCount();
            }
        }

        // Удаление товара из корзины
        function removeFromCart(itemId) {
            delete cartItems[itemId];
            localStorage.setItem('horseCart', JSON.stringify(cartItems));
            updateCartDisplay();
            updateCartCount();
        }

        // Добавление в избранное
        function addToFavorites(itemId) {
            const item = cartItems[itemId];
            if (!item) return;
            
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            // Проверяем, нет ли уже товара в избранном
            if (!favorites.find(fav => fav.id === itemId)) {
                favorites.push(item);
                localStorage.setItem('favorites', JSON.stringify(favorites));
                alert('Товар добавлен в избранное!');
            } else {
                alert('Товар уже в избранном!');
            }
        }

        // Обновление счетчика в шапке
        function updateCartCount() {
            const totalItems = Object.values(cartItems).reduce((sum, item) => sum + item.quantity, 0);
            document.getElementById('cartCount').textContent = totalItems;
        }

        // Применение промокода
        function applyPromoCode() {
            const promoCode = document.getElementById('promoCode').value || document.getElementById('checkoutPromoCode').value;
            const subtotal = calculateSubtotal();
            
            if (promoCode === 'AKZ2024') {
                discount = Math.floor(subtotal * 0.1); // 10% скидка
                alert('Промокод применен! Скидка 10%');
            } else if (promoCode === 'FREE500') {
                discount = 500;
                alert('Промокод применен! Скидка 500 ₽');
            } else if (promoCode) {
                alert('Промокод недействителен');
                discount = 0;
            }
            
            updateSummary(subtotal, discount);
            updateCheckoutSummary();
        }

        // Загрузка рекомендаций
        function loadRecommendations() {
            const container = document.getElementById('recommendationsContainer');
            container.innerHTML = '';
            
            recommendations.forEach(item => {
                const cardHTML = `
                    <div class="recommendation-card" onclick="addToCartFromRecommendation(${item.id})">
                        <img src="${item.image}" alt="${item.name}" class="recommendation-image">
                        <div class="recommendation-name">${item.name}</div>
                        <div class="cart-item-specs">${item.specs}</div>
                        <div class="recommendation-price">${item.price} ₽</div>
                    </div>
                `;
                container.innerHTML += cardHTML;
            });
        }

        // Добавление товара из рекомендаций
        function addToCartFromRecommendation(itemId) {
            const item = recommendations.find(rec => rec.id === itemId);
            if (!item) return;
            
            if (cartItems[itemId]) {
                cartItems[itemId].quantity += 1;
            } else {
                cartItems[itemId] = {
                    ...item,
                    quantity: 1
                };
            }
            
            localStorage.setItem('horseCart', JSON.stringify(cartItems));
            updateCartDisplay();
            updateCartCount();
            alert('Товар добавлен в корзину!');
        }

        // Переход к шагу
        function goToStep(step) {
            currentStep = step;
            
            // Скрываем все шаги
            document.querySelectorAll('.checkout-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Показываем нужный шаг
            document.getElementById(step + 'Step').classList.add('active');
            
            // Обновляем индикатор шагов
            document.querySelectorAll('.checkout-step').forEach(s => s.classList.remove('active', 'completed'));
            
            if (step === 'cart') {
                document.getElementById('stepCart').classList.add('active');
                document.getElementById('stepCheckout').classList.remove('active');
            } else if (step === 'checkout') {
                document.getElementById('stepCart').classList.add('completed');
                document.getElementById('stepCheckout').classList.add('active');
                updateConfirmationDetails();
            }
        }

        // Обновление деталей подтверждения
        function updateConfirmationDetails() {
            // Контактные данные
            document.getElementById('confirmCustomerName').textContent = document.getElementById('customerName').value || 'Не указано';
            document.getElementById('confirmCustomerPhone').textContent = document.getElementById('customerPhone').value || 'Не указано';
            document.getElementById('confirmCustomerEmail').textContent = document.getElementById('customerEmail').value || 'Не указан';
            
            // Адрес доставки
            const city = document.getElementById('deliveryCity').value;
            const street = document.getElementById('deliveryStreet').value;
            const house = document.getElementById('deliveryHouse').value;
            const apartment = document.getElementById('deliveryApartment').value;
            let address = `${city || 'Не указан'}, ${street || 'Не указана'}, д. ${house || 'Не указан'}`;
            if (apartment) address += `, кв. ${apartment}`;
            document.getElementById('confirmDeliveryAddress').textContent = address;
            
            // Способ доставки
            const deliveryMethod = document.querySelector('input[name="delivery"]:checked').value;
            const deliveryText = {
                'courier': 'Курьерская доставка',
                'pickup': 'Самовывоз',
                'post': 'Почта России'
            };
            document.getElementById('confirmDeliveryMethod').textContent = deliveryText[deliveryMethod];
            
            // Способ оплаты
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            const paymentText = {
                'card': 'Банковская карта',
                'sbp': 'СБП',
                'applepay': 'Apple Pay',
                'googlepay': 'Google Pay'
            };
            document.getElementById('confirmPaymentMethod').textContent = paymentText[paymentMethod];
            
            // Состав заказа
            const orderItemsContainer = document.getElementById('confirmOrderItems');
            orderItemsContainer.innerHTML = '';
            
            Object.values(cartItems).forEach(item => {
                const itemHTML = `
                    <div class="order-item">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>${item.price * item.quantity} ₽</span>
                    </div>
                `;
                orderItemsContainer.innerHTML += itemHTML;
            });
        }

        // Валидация и обработка оплаты
        function validateAndProcessPayment() {
            const requiredFields = [
                { id: 'customerName', validator: validateName },
                { id: 'customerPhone', validator: validatePhone },
                { id: 'deliveryCity', validator: (val) => val.trim() !== '' },
                { id: 'deliveryStreet', validator: (val) => val.trim() !== '' },
                { id: 'deliveryHouse', validator: (val) => val.trim() !== '' }
            ];

            let isValid = true;
            let firstInvalidField = null;
            
            // Сбрасываем все ошибки
            requiredFields.forEach(field => {
                const element = document.getElementById(field.id);
                const formGroup = element.closest('.form-group');
                formGroup.classList.remove('error', 'success');
            });

            // Проверяем каждое поле
            requiredFields.forEach(field => {
                const element = document.getElementById(field.id);
                const formGroup = element.closest('.form-group');
                
                if (!field.validator(element.value)) {
                    formGroup.classList.add('error');
                    isValid = false;
                    
                    // Запоминаем первое невалидное поле
                    if (!firstInvalidField) {
                        firstInvalidField = element;
                    }
                } else {
                    formGroup.classList.add('success');
                }
            });

            // Проверяем необязательные поля, если они заполнены
            const emailField = document.getElementById('customerEmail');
            if (emailField.value.trim() !== '' && !validateEmail(emailField.value)) {
                document.getElementById('emailGroup').classList.add('error');
                isValid = false;
                if (!firstInvalidField) firstInvalidField = emailField;
            }

            const indexField = document.getElementById('deliveryIndex');
            if (indexField.value.trim() !== '' && !validatePostalCode(indexField.value)) {
                document.getElementById('indexGroup').classList.add('error');
                isValid = false;
                if (!firstInvalidField) firstInvalidField = indexField;
            }

            if (!isValid) {
                // Прокручиваем к первому невалидному полю
                firstInvalidField.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                firstInvalidField.focus();
                
                showCustomAlert('Пожалуйста, исправьте ошибки в форме перед оформлением заказа');
                return;
            }

            const agreeTerms = document.getElementById('agreeTerms').checked;

            if (!agreeTerms) {
                alert('Необходимо согласие с условиями обработки персональных данных');
                return;
            }

            // Сохраняем адрес если пользователь зарегистрирован и выбрал опцию
            if (userData.isLoggedIn && document.getElementById('saveAddress').checked) {
                saveUserAddress();
            }

            // Создаем заказ
            const orderNumber = 'AKZ-' + Math.random().toString().substr(2, 4);
            const totalAmount = calculateSubtotal() - discount + deliveryCost + assemblyCost;
            const selectedPayment = document.querySelector('input[name="payment"]:checked').value;

            // Сохраняем историю заказов если пользователь зарегистрирован
            if (userData.isLoggedIn) {
                saveOrderHistory(orderNumber, totalAmount);
            }

            // Показываем модальное окно подтверждения
            showOrderConfirmation(orderNumber, totalAmount, selectedPayment);
        }

        // Функция для красивого уведомления
        function showCustomAlert(message) {
            // Создаем элемент уведомления
            const alert = document.createElement('div');
            alert.className = 'custom-alert';
            alert.innerHTML = `
                <div class="custom-alert-content">
                    <h3>Уведомление</h3>
                    <p>${message}</p>
                    <button class="btn-checkout" onclick="this.parentElement.parentElement.remove()">Закрыть</button>
                </div>
            `;
            
            document.body.appendChild(alert);
        }

        // Сохранение адреса пользователя
        function saveUserAddress() {
            userData.profile.address = {
                city: document.getElementById('deliveryCity').value,
                street: document.getElementById('deliveryStreet').value,
                house: document.getElementById('deliveryHouse').value,
                apartment: document.getElementById('deliveryApartment').value,
                index: document.getElementById('deliveryIndex').value
            };

            // Сохраняем предпочтения доставки и оплаты
            userData.profile.preferredDelivery = document.querySelector('input[name="delivery"]:checked').value;
            userData.profile.preferredPayment = document.querySelector('input[name="payment"]:checked').value;

            // Сохраняем в localStorage (в реальном приложении - запрос к API)
            localStorage.setItem('userProfile', JSON.stringify(userData.profile));
            
            console.log('Адрес и предпочтения сохранены в профиле');
        }

        // Сохранение истории заказов
        function saveOrderHistory(orderNumber, totalAmount) {
            const order = {
                number: orderNumber,
                date: new Date().toISOString(),
                total: totalAmount,
                items: Object.values(cartItems),
                delivery: document.querySelector('input[name="delivery"]:checked').value,
                payment: document.querySelector('input[name="payment"]:checked').value,
                status: 'completed'
            };

            let orderHistory = JSON.parse(localStorage.getItem('userOrderHistory')) || [];
            orderHistory.unshift(order);
            localStorage.setItem('userOrderHistory', JSON.stringify(orderHistory));
        }

        // Показать подтверждение заказа
        function showOrderConfirmation(orderNumber, totalAmount, paymentMethod) {
            const modal = document.getElementById('successModal');
            const orderItems = document.getElementById('modalOrderItems');
            
            // Заполняем детали заказа
            document.getElementById('modalOrderNumber').textContent = orderNumber;
            document.getElementById('modalOrderDate').textContent = new Date().toLocaleDateString('ru-RU');
            document.getElementById('modalOrderTotal').textContent = `${totalAmount} ₽`;
            document.getElementById('modalPaymentStatus').textContent = 'Оплачено';
            
            // Заполняем товары
            orderItems.innerHTML = '';
            Object.values(cartItems).forEach(item => {
                const itemHTML = `
                    <div class="order-item">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>${item.price * item.quantity} ₽</span>
                    </div>
                `;
                orderItems.innerHTML += itemHTML;
            });
            
            // Добавляем сборку, доставку и скидку
            if (assemblyCost > 0) {
                orderItems.innerHTML += `<div class="order-item"><span>Сборка товара</span><span>${assemblyCost} ₽</span></div>`;
            }
            if (deliveryCost > 0) {
                orderItems.innerHTML += `<div class="order-item"><span>Доставка</span><span>${deliveryCost} ₽</span></div>`;
            }
            if (discount > 0) {
                orderItems.innerHTML += `<div class="order-item"><span>Скидка</span><span>-${discount} ₽</span></div>`;
            }
            orderItems.innerHTML += `<div class="order-item" style="font-weight: 600; border-top: 2px solid #4caf50; padding-top: 1rem;"><span>Итого</span><span>${totalAmount} ₽</span></div>`;
            
            modal.classList.add('active');
            
            // Очищаем корзину после успешного заказа
            cartItems = {};
            localStorage.setItem('horseCart', JSON.stringify(cartItems));
            updateCartDisplay();
            updateCartCount();
        }

        // Закрытие модального окна
        function closeSuccessModal() {
            document.getElementById('successModal').classList.remove('active');
            goToStep('cart');
        }

        // Функции для работы с подпиской
        function getUserSubscription() {
            const userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
            return userProfile.subscription || 'free';
        }

        function calculateSubscriptionSavings() {
            const cart = JSON.parse(localStorage.getItem('horseCart')) || {};
            const subscription = getUserSubscription();
            let totalSavings = 0;
            let itemsWithSavings = [];
            let potentialSavings = 0;

            Object.values(cart).forEach(item => {
                if (item.originalPrice && item.finalPrice) {
                    const currentSavings = item.originalPrice - item.finalPrice;
                    totalSavings += currentSavings * item.quantity;
                    
                    // Рассчитываем потенциальную экономию для PRO
                    if (subscription === 'premium' && item.subscriptionPrice) {
                        const potential = item.finalPrice - item.subscriptionPrice;
                        potentialSavings += potential * item.quantity;
                    }
                    
                    itemsWithSavings.push({
                        name: item.name,
                        savings: currentSavings * item.quantity,
                        quantity: item.quantity
                    });
                }
            });

            return {
                totalSavings,
                itemsWithSavings,
                potentialSavings
            };
        }

        function displaySavings() {
            const subscription = getUserSubscription();
            const savingsBlock = document.getElementById('savingsBlock');
            const upgradeOffer = document.getElementById('upgradeOffer');
            const savings = calculateSubscriptionSavings();

            if (subscription !== 'free' && savings.totalSavings > 0) {
                // Показываем текущую экономию
                savingsBlock.style.display = 'block';
                
                let savingsHTML = '';
                savings.itemsWithSavings.forEach(item => {
                    savingsHTML += `
                        <div class="savings-item">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>-${item.savings} ₽</span>
                        </div>
                    `;
                });
                
                savingsHTML += `
                    <div class="savings-total">
                        <span>Общая экономия</span>
                        <span>-${savings.totalSavings} ₽</span>
                    </div>
                `;
                
                document.getElementById('savingsDetails').innerHTML = savingsHTML;

                // Показываем предложение апгрейда для premium подписчиков
                if (subscription === 'premium' && savings.potentialSavings > 0) {
                    upgradeOffer.style.display = 'block';
                    document.getElementById('upgradeSavings').innerHTML = 
                        `Дополнительная экономия: ${savings.potentialSavings} ₽`;
                }
            } else {
                savingsBlock.style.display = 'none';
                upgradeOffer.style.display = 'none';
            }
        }

        function upgradeSubscription() {
            if (confirm('Перейти на подписку "Спортсмен" за 2490 ₽/месяц?')) {
                // Сохраняем выбор подписки
                let userProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
                userProfile.subscription = 'pro';
                userProfile.subscriptionActive = true;
                localStorage.setItem('userProfile', JSON.stringify(userProfile));
                
                // Пересчитываем цены в корзине
                updateCartPricesForSubscription();
                alert('Подписка улучшена! Ваши цены обновлены.');
            }
        }

        function updateCartPricesForSubscription() {
            const cart = JSON.parse(localStorage.getItem('horseCart')) || {};
            const subscription = getUserSubscription();
            
            Object.keys(cart).forEach(itemId => {
                const item = cart[itemId];
                if (item.subscriptionPrice && subscription === 'pro') {
                    item.finalPrice = item.subscriptionPrice;
                }
            });
            
            localStorage.setItem('horseCart', JSON.stringify(cart));
            updateCartDisplay();
            displaySavings();
        }

        function updateDeliveryCostForSubscription() {
            const subscription = getUserSubscription();
            const deliveryCostElement = document.getElementById('deliveryCost');
            const checkoutDeliveryCostElement = document.getElementById('checkoutDeliveryCost');
            
            if ((subscription === 'premium' || subscription === 'pro') && calculateSubtotal() >= 2000) {
                deliveryCost = 0;
                if (deliveryCostElement) deliveryCostElement.textContent = '0 ₽';
                if (checkoutDeliveryCostElement) checkoutDeliveryCostElement.textContent = '0 ₽';
                
                // Добавляем пометку о бесплатной доставке
                if (!document.querySelector('.delivery-free')) {
                    const freeLabel = document.createElement('span');
                    freeLabel.className = 'delivery-free';
                    freeLabel.textContent = ' (бесплатно для подписчиков)';
                    if (deliveryCostElement) deliveryCostElement.appendChild(freeLabel.cloneNode(true));
                    if (checkoutDeliveryCostElement) checkoutDeliveryCostElement.appendChild(freeLabel);
                }
            } else {
                // Стандартная логика расчета доставки
                updateDeliveryCost();
            }
        }

        function getSubscriptionName(subscriptionType) {
            const names = {
                'free': 'Любитель',
                'premium': 'Конник',
                'pro': 'Спортсмен'
            };
            return names[subscriptionType] || 'Неизвестно';
        }

        // Инициализация выбора доставки и оплаты
        updateDeliverySelection();
        updatePaymentSelection();
        updateDeliveryCost();
// Функция применения промокода
function applyPromoCode() {
    const promoCode = document.getElementById('promo_code').value;
    const promoMessage = document.getElementById('promoMessage');
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    if (!promoCode.trim()) {
        promoMessage.textContent = 'Введите промокод';
        promoMessage.className = 'promo-message error';
        return;
    }
    
    fetch('/cart/api/apply-promo/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({ promo_code: promoCode })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            promoMessage.textContent = data.message;
            promoMessage.className = 'promo-message success';
            updateTotal();
        } else {
            promoMessage.textContent = data.message;
            promoMessage.className = 'promo-message error';
        }
    })
    .catch(error => {
        promoMessage.textContent = 'Ошибка сервера';
        promoMessage.className = 'promo-message error';
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем авторизацию
    checkAuthForCart();
    
    // Настраиваем форму оформления заказа
    setupCheckoutForm();
});

function checkAuthForCart() {
    if (!document.querySelector('.cart-items-list')) {
        // Если корзина пустая, проверяем авторизацию
        fetch('/api/user-info/')
            .then(response => response.json())
            .then(data => {
                if (!data.is_authenticated) {
                    // Показываем сообщение о необходимости авторизации
                    const emptyCart = document.querySelector('.empty-cart');
                    if (emptyCart) {
                        emptyCart.innerHTML = `
                            <div class="empty-cart-icon">🔒</div>
                            <h2>Для доступа к корзине требуется авторизация</h2>
                            <p>Войдите или зарегистрируйтесь, чтобы добавлять товары в корзину</p>
                            <div class="cart-actions">
                                <button onclick="showAuthModal('login')" class="btn-upgrade premium">
                                    🔐 Войти в аккаунт
                                </button>
                                <button onclick="showAuthModal('register')" class="btn-continue">
                                    📝 Зарегистрироваться
                                </button>
                            </div>
                        `;
                    }
                }
            });
    }
}

function setupCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Проверка обязательных полей
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.style.borderColor = '#e74c3c';
                } else {
                    field.style.borderColor = '';
                }
            });
            
            if (!isValid) {
                alert('Пожалуйста, заполните все обязательные поля');
                return;
            }
            
            // Отправка формы
            const formData = new FormData(form);
            
            fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = data.redirect_url;
                } else {
                    alert(data.message || 'Ошибка оформления заказа');
                }
            })
            .catch(error => {
                alert('Ошибка сети. Пожалуйста, попробуйте еще раз');
            });
        });
    }
}