// Общие функции для всех страниц
const SharedApp = {
    // Загрузка статистики пользователя
    loadUserStats: function() {
        fetch('/profile/api/stats/')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.updateStatsDisplay(data.stats);
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки статистики:', error);
            });
    },
    
    // Обновление отображения статистики
    updateStatsDisplay: function(stats) {
        // Обновляем счетчики в шапке или других местах
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            // Можно обновить количество товаров в корзине
            // cartCount.textContent = stats.cart_items_count || 0;
        }
        
        // Обновляем статистику на странице профиля
        if (window.location.pathname.includes('/profile/')) {
            this.updateProfileStats(stats);
        }
    },
    
    // Обновление статистики в профиле
    updateProfileStats: function(stats) {
        // Лошади
        const horsesCount = document.getElementById('horsesCount');
        if (horsesCount) horsesCount.textContent = stats.horses_count || 0;
        
        // Заказы
        const ordersCount = document.getElementById('ordersCount');
        if (ordersCount) {
            const totalOrders = (stats.food_orders_count || 0) + (stats.horse_bookings_count || 0);
            ordersCount.textContent = totalOrders;
        }
        
        // Годы с нами
        const yearsCount = document.getElementById('yearsCount');
        if (yearsCount) yearsCount.textContent = stats.years_count || 1;
        
        // Всего потрачено
        const totalSpent = document.getElementById('totalSpent');
        if (totalSpent) totalSpent.textContent = `${stats.total_spent?.toLocaleString('ru-RU') || 0} ₽`;
        
        // Экономия
        const totalSavings = document.getElementById('totalSavings');
        if (totalSavings) totalSavings.textContent = `${stats.horse_savings?.toLocaleString('ru-RU') || 0} ₽`;
        
        // Рейтинг
        const userRating = document.getElementById('userRating');
        if (userRating) userRating.textContent = stats.user_rating || '4.8';
    },
    
    // Загрузка бронирований лошадей
    loadHorseBookings: function() {
        return fetch('/horses/api/user-bookings/')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    return data.bookings;
                }
                return [];
            })
            .catch(error => {
                console.error('Ошибка загрузки бронирований:', error);
                return [];
            });
    },
    
    // Получить CSRF токен
    getCSRFToken: function() {
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfToken ? csrfToken.value : '';
    },
    
    // Показать уведомление
    showNotification: function(message, type = 'info', duration = 5000) {
        // Проверяем, есть ли уже контейнер для уведомлений
        let container = document.getElementById('notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(container);
        }
        
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 300px;
            max-width: 400px;
        `;
        
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0 0 0 10px;
                opacity: 0.8;
            ">×</button>
        `;
        
        container.appendChild(notification);
        
        // Автоудаление через duration миллисекунд
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
        
        return notification;
    },
    
    // Инициализация
    init: function() {
        // Добавляем стили для уведомлений
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
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
                
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Загружаем статистику если пользователь авторизован
        if (document.body.classList.contains('user-authenticated')) {
            this.loadUserStats();
        }
    }
};

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    SharedApp.init();
});