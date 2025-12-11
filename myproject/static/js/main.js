// Получение CSRF токена для AJAX запросов
function getCSRFToken() {
    const csrfTokenElement = document.querySelector('meta[name="csrf-token"]');
    if (csrfTokenElement) {
        return csrfTokenElement.getAttribute('content');
    }
    return '';
}

// Система аутентификации
let currentUser = null;

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, инициализация...');
    
    // Добавляем стили для уведомлений и индикаторов
    addNotificationStyles();
    
    // Сначала настраиваем обработчики событий
    setupEventListeners();
    
    // Затем проверяем статус авторизации
    checkAuthStatus();
    
    // Настраиваем модальное окно
    setupAuthModal();
    
    // Настраиваем навигацию
    setupNavigation();
    
    // Инициализация свайпаемых виджетов
    initWidgets();
});

// Добавление стилей для уведомлений
function addNotificationStyles() {
    const notificationStyles = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            background: #2196f3;
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideIn 0.3s ease;
            display: none;
            max-width: 400px;
            font-weight: 500;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .notification.error {
            background: #f44336;
        }
        
        .notification.success {
            background: #4caf50;
        }
        
        .notification.info {
            background: #2196f3;
        }
        
        .notification.warning {
            background: #ff9800;
        }
        
        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            vertical-align: middle;
            margin-right: 5px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .btn-subscribe.disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        .btn-subscribe.disabled:hover {
            transform: none;
            box-shadow: none;
        }
        
        /* Стили для текущей подписки */
        .subscription-card.active {
            border: 3px solid #4caf50;
            transform: scale(1.02);
        }
        
        .subscription-card.active.popular {
            border-color: #2196f3;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = notificationStyles;
    document.head.appendChild(styleSheet);
}

// Показать уведомление
function showNotification(message, type = 'info') {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Проверка статуса авторизации через Django
function checkAuthStatus() {
    console.log('Проверка статуса авторизации...');
    
    fetch('/api/user-info/')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Данные пользователя:', data);
            if (data.is_authenticated) {
                currentUser = data;
                updateUIForLoggedInUser();
                updateSubscriptionDisplay(data);
                updateCartCount();
            } else {
                updateUIForGuest();
            }
        })
        .catch(error => {
            console.error('Ошибка проверки авторизации:', error);
            updateUIForGuest();
        });
}

// Обновление счетчика корзины
function updateCartCount() {
    const cartCount = localStorage.getItem('cartCount') || '0';
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = cartCount;
    });
}

// Обновление интерфейса для авторизованного пользователя
function updateUIForLoggedInUser() {
    console.log('Обновление UI для авторизованного пользователя:', currentUser);
    
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        const displayName = currentUser.username.length > 15 
            ? currentUser.username.substring(0, 15) + '...' 
            : currentUser.username;
        
        profileLink.innerHTML = `👤 ${displayName}`;
        profileLink.href = '/profile/';
        profileLink.onclick = null;
        profileLink.style.cursor = 'pointer';
        profileLink.title = 'Перейти в профиль';
        
        // Обновляем текст в навигации (для мобильного меню)
        const navProfileLink = document.querySelector('.nav-list #profileLink');
        if (navProfileLink) {
            navProfileLink.innerHTML = `👤 ${displayName}`;
            navProfileLink.href = '/profile/';
            navProfileLink.onclick = null;
        }
    }
    
    // Обновляем кнопку выхода в мобильном меню
    updateMobileMenuForLoggedInUser();
    
    // Разблокируем функционал покупок
    enablePurchaseFeatures();
}

// Обновление мобильного меню для авторизованного пользователя
function updateMobileMenuForLoggedInUser() {
    // Добавляем кнопку выхода в мобильное меню
    const navMenu = document.getElementById('navMenu');
    if (navMenu && !navMenu.querySelector('#logoutMobileBtn')) {
        const logoutItem = document.createElement('a');
        logoutItem.href = '#';
        logoutItem.className = 'nav-link';
        logoutItem.id = 'logoutMobileBtn';
        logoutItem.innerHTML = '🚪 Выйти';
        logoutItem.onclick = function(e) {
            e.preventDefault();
            logout();
        };
        navMenu.appendChild(logoutItem);
    }
}

// Обновление интерфейса для гостя
function updateUIForGuest() {
    console.log('Обновление UI для гостя');
    
    const profileLink = document.getElementById('profileLink');
    if (profileLink) {
        profileLink.textContent = 'Войти';
        profileLink.href = '#';
        profileLink.onclick = (e) => {
            e.preventDefault();
            showAuthModal();
        };
        profileLink.style.cursor = 'pointer';
        profileLink.title = 'Войти в систему';
        
        // Обновляем текст в навигации
        const navProfileLink = document.querySelector('.nav-list #profileLink');
        if (navProfileLink) {
            navProfileLink.textContent = 'Войти';
            navProfileLink.href = '#';
            navProfileLink.onclick = (e) => {
                e.preventDefault();
                showAuthModal();
            };
        }
    }
    
    // Удаляем кнопку выхода из мобильного меню
    const logoutMobileBtn = document.getElementById('logoutMobileBtn');
    if (logoutMobileBtn) {
        logoutMobileBtn.remove();
    }
    
    // Блокируем функционал покупок
    disablePurchaseFeatures();
}

// Обновление отображения подписки на главной странице
function updateSubscriptionDisplay(userData) {
    // Убираем все активные классы
    document.querySelectorAll('.subscription-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Добавляем активный класс текущей подписке
    const currentSubscriptionCard = document.querySelector(`.subscription-card .btn-subscribe[data-subscription="${userData.subscription}"]`);
    if (currentSubscriptionCard) {
        const subscriptionCard = currentSubscriptionCard.closest('.subscription-card');
        if (subscriptionCard) {
            subscriptionCard.classList.add('active');
        }
    }
    
    // Обновляем кнопки подписки
    const subscriptionButtons = document.querySelectorAll('.btn-subscribe');
    subscriptionButtons.forEach(button => {
        const subscriptionType = button.getAttribute('data-subscription');
        
        if (subscriptionType === userData.subscription) {
            // Текущая подписка
            button.disabled = true;
            button.classList.add('disabled');
            
            if (subscriptionType === 'premium') {
                button.innerHTML = '✅ Активная подписка';
                button.style.background = 'linear-gradient(45deg, #2196f3, #21cbf3)';
            } else if (subscriptionType === 'pro') {
                button.innerHTML = '⭐ Премиум активен';
                button.style.background = 'linear-gradient(45deg, #ff9800, #ff5722)';
            } else {
                button.innerHTML = '✅ Текущая подписка';
                button.style.background = 'linear-gradient(45deg, #4caf50, #8bc34a)';
            }
        } else {
            // Не текущая подписка
            button.disabled = false;
            button.classList.remove('disabled');
            button.style.background = '';
            
            if (subscriptionType === 'free') {
                button.textContent = 'Выбрать';
            } else {
                button.textContent = 'Выбрать подписку';
            }
        }
    });
}

// Настройка навигации
function setupNavigation() {
    console.log('Настройка навигации...');
    
    // Обработчики для меню
    document.querySelectorAll('.nav-link').forEach(link => {
        if (!link.id || link.id !== 'profileLink') {
            link.addEventListener('click', function() {
                document.getElementById('menuToggle').checked = false;
            });
        }
    });
    
    // Закрытие меню при клике на оверлей
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
        menuOverlay.addEventListener('click', function() {
            document.getElementById('menuToggle').checked = false;
        });
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('Настройка обработчиков событий...');
    
    // Кнопка входа
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        console.log('Найдена кнопка входа');
        loginBtn.addEventListener('click', login);
    } else {
        console.warn('Кнопка входа не найдена');
    }
    
    // Кнопка регистрации
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        console.log('Найдена кнопка регистрации');
        registerBtn.addEventListener('click', register);
    } else {
        console.warn('Кнопка регистрации не найдена');
    }
    
    // Кнопки подписки
    document.querySelectorAll('.btn-subscribe').forEach(button => {
        button.addEventListener('click', function() {
            const subscriptionType = this.getAttribute('data-subscription');
            selectSubscription(subscriptionType);
        });
    });
    
    // Обработчики для форм входа/регистрации через Enter
    document.getElementById('loginPassword')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });
    
    document.getElementById('registerConfirm')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            register();
        }
    });
    
    // Обработчик для кнопки "Узнать больше"
    const learnMoreBtn = document.querySelector('.btn-nature');
    if (learnMoreBtn) {
        learnMoreBtn.addEventListener('click', scrollToAbout);
    }
}

// Блокировка функционала покупок для гостей
function disablePurchaseFeatures() {
    console.log('Блокировка функций покупок для гостей');
    
    document.querySelectorAll('.btn-subscribe').forEach(button => {
        if (!button.hasAttribute('data-original-onclick')) {
            button.setAttribute('data-original-onclick', button.getAttribute('onclick') || '');
        }
        button.onclick = function(e) {
            e.preventDefault();
            showNotification('Для выбора подписки необходимо войти в систему', 'warning');
            showAuthModal();
        };
        button.title = 'Для выбора подписки необходимо войти в систему';
    });
}

// Разблокировка функционала покупок
function enablePurchaseFeatures() {
    console.log('Разблокировка функций покупок');
    
    document.querySelectorAll('.btn-subscribe').forEach(button => {
        const originalOnclick = button.getAttribute('data-original-onclick');
        if (originalOnclick && originalOnclick !== 'null') {
            button.onclick = function() {
                const subscriptionType = this.getAttribute('data-subscription');
                selectSubscription(subscriptionType);
            };
        }
        button.removeAttribute('title');
    });
}

// Показать модальное окно авторизации
function showAuthModal() {
    console.log('Показать модальное окно авторизации');
    
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.display = 'flex';
        authModal.style.opacity = '1';
        authModal.style.visibility = 'visible';
        showLogin();
    } else {
        console.error('Модальное окно не найдено!');
    }
}

// Скрыть модальное окно авторизации
function hideAuthModal() {
    console.log('Скрыть модальное окно авторизации');
    
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.display = 'none';
        authModal.style.opacity = '0';
        authModal.style.visibility = 'hidden';
    }
}

// Показать форму входа
function showLogin() {
    console.log('Показать форму входа');
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const loginForm = document.getElementById('loginForm');
    const loginTab = document.querySelector('[data-tab="login"]');
    
    if (loginForm && loginTab) {
        loginForm.classList.add('active');
        loginTab.classList.add('active');
        
        // Фокус на поле ввода
        setTimeout(() => {
            const usernameInput = document.getElementById('loginUsername');
            if (usernameInput) {
                usernameInput.focus();
            }
        }, 100);
    }
}

// Показать форму регистрации
function showRegister() {
    console.log('Показать форму регистрации');
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const registerForm = document.getElementById('registerForm');
    const registerTab = document.querySelector('[data-tab="register"]');
    
    if (registerForm && registerTab) {
        registerForm.classList.add('active');
        registerTab.classList.add('active');
        
        // Фокус на поле ввода
        setTimeout(() => {
            const usernameInput = document.getElementById('registerUsername');
            if (usernameInput) {
                usernameInput.focus();
            }
        }, 100);
    }
}

// Настройка модального окна
function setupAuthModal() {
    console.log('Настройка модального окна...');
    
    const modal = document.getElementById('authModal');
    const closeBtn = document.getElementById('authClose');
    
    if (!modal) {
        console.error('Модальное окно не найдено!');
        return;
    }
    
    if (!closeBtn) {
        console.error('Кнопка закрытия не найдена!');
        return;
    }
    
    // Закрытие по крестику
    closeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        hideAuthModal();
    });
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideAuthModal();
        }
    });
    
    // Переключение табов
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            if (tabName === 'login') {
                showLogin();
            } else if (tabName === 'register') {
                showRegister();
            }
        });
    });
    
    // Закрытие по ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideAuthModal();
        }
    });
}

// Функция входа через Django
function login() {
    console.log('Функция login вызвана');
    
    const username = document.getElementById('loginUsername')?.value.trim();
    const password = document.getElementById('loginPassword')?.value;
    
    console.log('Вход:', { username, password });
    
    if (!username || !password) {
        showNotification('Пожалуйста, заполните все поля', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    const loginBtn = document.getElementById('loginBtn');
    const originalText = loginBtn.textContent;
    loginBtn.innerHTML = '<span class="loading"></span> Вход...';
    loginBtn.disabled = true;
    
    fetch('/api/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })
    .then(response => {
        console.log('Статус ответа входа:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Ответ сервера входа:', data);
        
        // Восстанавливаем кнопку
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
        
        if (data.success) {
            hideAuthModal();
            currentUser = data.user;
            showNotification(data.message, 'success');
            
            // Обновляем интерфейс
            updateUIForLoggedInUser();
            updateSubscriptionDisplay(data.user);
            
            // Очищаем поля формы
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
            
            // Если есть URL для редиректа, используем его
            if (data.redirect_url) {
                setTimeout(() => {
                    window.location.href = data.redirect_url;
                }, 1000);
            } else {
                // Иначе просто перезагружаем страницу
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        } else {
            showNotification(data.message || 'Ошибка входа', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка входа:', error);
        
        // Восстанавливаем кнопку
        loginBtn.textContent = originalText;
        loginBtn.disabled = false;
        
        showNotification('Произошла ошибка при входе. Проверьте подключение к интернету.', 'error');
    });
}

// Функция регистрации через Django
function register() {
    console.log('Функция register вызвана');
    
    const username = document.getElementById('registerUsername')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const confirmPassword = document.getElementById('registerConfirm')?.value;
    const agreeTerms = document.getElementById('agreeTerms')?.checked;
    
    console.log('Регистрация:', { username, email, password, confirmPassword, agreeTerms });
    
    // Валидация
    if (!username) {
        showNotification('Пожалуйста, введите имя пользователя', 'error');
        return;
    }
    
    if (!email) {
        showNotification('Пожалуйста, введите email', 'error');
        return;
    }
    
    // Проверка email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Пожалуйста, введите корректный email', 'error');
        return;
    }
    
    if (!password) {
        showNotification('Пожалуйста, введите пароль', 'error');
        return;
    }
    
    if (password.length < 8) {
        showNotification('Пароль должен содержать не менее 8 символов', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Пароли не совпадают', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showNotification('Необходимо согласие с условиями использования', 'error');
        return;
    }
    
    // Показываем индикатор загрузки
    const registerBtn = document.getElementById('registerBtn');
    const originalText = registerBtn.textContent;
    registerBtn.innerHTML = '<span class="loading"></span> Регистрация...';
    registerBtn.disabled = true;
    
    // Отправка данных в Django
    fetch('/api/register/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password
        })
    })
    .then(response => {
        console.log('Статус ответа:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Ответ сервера:', data);
        
        // Восстанавливаем кнопку
        registerBtn.textContent = originalText;
        registerBtn.disabled = false;
        
        if (data.success) {
            hideAuthModal();
            showNotification(data.message, 'success');
            
            // Очищаем поля формы
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerConfirm').value = '';
            document.getElementById('agreeTerms').checked = false;
            
            // Если есть URL для редиректа, используем его
            if (data.redirect_url) {
                setTimeout(() => {
                    window.location.href = data.redirect_url;
                }, 1000);
            } else {
                // Иначе просто перезагружаем страницу
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        } else {
            showNotification(data.message || 'Ошибка регистрации', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка регистрации:', error);
        
        // Восстанавливаем кнопку
        registerBtn.textContent = originalText;
        registerBtn.disabled = false;
        
        showNotification('Произошла ошибка при регистрации. Проверьте подключение к интернету.', 'error');
    });
}

// Выход из системы
function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        fetch('/api/logout/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification(data.message, 'success');
                currentUser = null;
                updateUIForGuest();
                
                // Если есть URL для редиректа, используем его
                if (data.redirect_url) {
                    setTimeout(() => {
                        window.location.href = data.redirect_url;
                    }, 1000);
                } else {
                    // Иначе просто перезагружаем страницу
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                }
            }
        })
        .catch(error => {
            console.error('Ошибка выхода:', error);
            showNotification('Ошибка при выходе из системы', 'error');
        });
    }
}

// Функция для плавной прокрутки к разделу "О нас"
function scrollToAbout() {
    const aboutSection = document.getElementById('about');
    if (aboutSection) {
        aboutSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Функция выбора подписки
function selectSubscription(subscriptionType) {
    if (!currentUser) {
        showNotification('Для выбора подписки необходимо войти в систему', 'warning');
        showAuthModal();
        return;
    }
    
    // Если пытаемся выбрать текущую подписку
    if (currentUser.subscription === subscriptionType) {
        showNotification(`У вас уже активна подписка "${currentUser.subscription_display}"`, 'info');
        return;
    }
    
    const subscriptionNames = {
        'free': 'Любитель',
        'premium': 'Конник', 
        'pro': 'Спортсмен'
    };
    
    const subscriptionPrices = {
        'free': 'бесплатно',
        'premium': '990 ₽/месяц',
        'pro': '2 490 ₽/месяц'
    };
    
    const subscriptionFeatures = {
        'free': ['Доступ к основному расписанию', 'Бронирование лошадей', 'Покупка кормов'],
        'premium': ['Скидка 15% на все услуги', 'Приоритетное бронирование', 'Бесплатная доставка'],
        'pro': ['Скидка 25% на все услуги', 'Персональная лошадь', 'Консультации тренера']
    };
    
    let confirmMessage;
    if (subscriptionType === 'free') {
        confirmMessage = `Перейти на бесплатную подписку "${subscriptionNames[subscriptionType]}"?\n\nВключает:\n• ${subscriptionFeatures[subscriptionType].join('\n• ')}`;
    } else {
        confirmMessage = `Оформить подписку "${subscriptionNames[subscriptionType]}" за ${subscriptionPrices[subscriptionType]}?\n\nВключает:\n• ${subscriptionFeatures[subscriptionType].join('\n• ')}`;
    }
    
    if (confirm(confirmMessage)) {
        const button = document.querySelector(`.btn-subscribe[data-subscription="${subscriptionType}"]`);
        const originalText = button.textContent;
        button.innerHTML = '<span class="loading"></span> Обработка...';
        button.disabled = true;
        
        fetch('/api/select-subscription/', {
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
            button.textContent = originalText;
            button.disabled = false;
            
            if (data.success) {
                showNotification(data.message, 'success');
                
                // Обновляем данные пользователя
                if (data.subscription) {
                    currentUser.subscription = data.subscription;
                    currentUser.subscription_display = data.subscription_display;
                    updateSubscriptionDisplay(currentUser);
                }
                
                // Если есть URL для редиректа, предлагаем перейти
                if (data.redirect_url) {
                    setTimeout(() => {
                        if (confirm('Подписка успешно оформлена! Перейти в личный кабинет?')) {
                            window.location.href = data.redirect_url;
                        }
                    }, 1000);
                }
            } else {
                showNotification(data.message || 'Ошибка выбора подписки', 'error');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            button.textContent = originalText;
            button.disabled = false;
            showNotification('Произошла ошибка при выборе подписки', 'error');
        });
    }
}

// Показать форму восстановления пароля
function showForgotPassword() {
    console.log('Показать форму восстановления пароля');
    
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    
    document.getElementById('forgotForm').classList.add('active');
}

// Отправить инструкции восстановления пароля
function sendPasswordReset() {
    const email = document.getElementById('forgotEmail')?.value.trim();
    
    if (!email) {
        showNotification('Пожалуйста, введите ваш email', 'error');
        return;
    }
    
    showNotification(`Инструкции по восстановлению пароля отправлены на ${email}`, 'info');
    setTimeout(() => {
        showLogin();
    }, 1500);
}

// Свайпаемые виджеты
function initWidgets() {
    console.log('Инициализация виджетов...');
    
    const widgetsContainer = document.getElementById('widgetsContainer');
    const widgetDots = document.getElementById('widgetDots');
    
    if (!widgetsContainer || !widgetDots) {
        console.log('Виджеты не найдены, пропускаем инициализацию');
        return;
    }
    
    const widgets = document.querySelectorAll('.widget');
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let autoSlideInterval;

    // Создаем точки навигации
    widgets.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.className = `dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(index));
        widgetDots.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');

    // Функция перехода к слайду
    function goToSlide(index) {
        currentIndex = index;
        updateSlider();
    }

    // Функция обновления слайдера
    function updateSlider() {
        widgetsContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
        
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    // Следующий слайд
    function nextSlide() {
        currentIndex = (currentIndex + 1) % widgets.length;
        updateSlider();
    }

    // Предыдущий слайд
    function prevSlide() {
        currentIndex = (currentIndex - 1 + widgets.length) % widgets.length;
        updateSlider();
    }

    // Обработчики для свайпа
    widgetsContainer.addEventListener('mousedown', startDrag);
    widgetsContainer.addEventListener('touchstart', startDrag);
    
    widgetsContainer.addEventListener('mousemove', drag);
    widgetsContainer.addEventListener('touchmove', drag);
    
    widgetsContainer.addEventListener('mouseup', endDrag);
    widgetsContainer.addEventListener('touchend', endDrag);
    widgetsContainer.addEventListener('mouseleave', endDrag);

    function startDrag(e) {
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        currentX = startX;
        
        stopAutoSlide();
        widgetsContainer.style.transition = 'none';
    }

    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        
        const diff = currentX - startX;
        const percentage = (diff / widgetsContainer.offsetWidth) * 100;
        const newTranslate = -currentIndex * 100 + percentage;
        
        widgetsContainer.style.transform = `translateX(${newTranslate}%)`;
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        
        widgetsContainer.style.transition = 'transform 0.5s ease';
        
        const diff = currentX - startX;
        const threshold = widgetsContainer.offsetWidth * 0.1;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        } else {
            updateSlider();
        }
        
        startAutoSlide();
    }

    // Автоматическое перелистывание
    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
            autoSlideInterval = null;
        }
    }

    // Останавливаем авто-слайдер при наведении
    widgetsContainer.addEventListener('mouseenter', stopAutoSlide);
    widgetsContainer.addEventListener('mouseleave', startAutoSlide);

    // Обработчики для клавиатуры
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            stopAutoSlide();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            stopAutoSlide();
        }
    });

    // Запускаем авто-слайдер
    startAutoSlide();
    
    console.log('Виджеты инициализированы');
}

// Добавляем глобальные функции для доступа из HTML
window.showAuthModal = showAuthModal;
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showForgotPassword = showForgotPassword;
window.sendPasswordReset = sendPasswordReset;
window.scrollToAbout = scrollToAbout;
window.logout = logout;
window.selectSubscription = selectSubscription;