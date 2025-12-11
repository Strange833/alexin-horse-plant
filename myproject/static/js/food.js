document.addEventListener('DOMContentLoaded', function() {
    // Инициализация поиска
    setupSearch();
    
    // Загрузка данных при скролле
    setupInfiniteScroll();
    
    // Инициализация фильтров
    setupFilters();
});

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 500);
        });
    }
}

function performSearch(query) {
    if (query.length < 2 && query.length > 0) return;
    
    const url = new URL(window.location);
    
    if (query) {
        url.searchParams.set('search', query);
    } else {
        url.searchParams.delete('search');
    }
    
    // Сбрасываем страницу при поиске
    url.searchParams.delete('page');
    
    window.location.href = url.toString();
}

function setupInfiniteScroll() {
    let isLoading = false;
    let page = 2;
    let hasMore = true;
    
    window.addEventListener('scroll', function() {
        if (isLoading || !hasMore) return;
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const pageHeight = document.documentElement.scrollHeight - 100;
        
        if (scrollPosition >= pageHeight) {
            loadMoreItems(page);
            page++;
        }
    });
}

function loadMoreItems(page) {
    isLoading = true;
    
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    
    fetch(url.toString())
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newItems = doc.querySelectorAll('.food-card');
            
            if (newItems.length === 0) {
                hasMore = false;
            } else {
                const foodGrid = document.getElementById('foodGrid');
                newItems.forEach(item => {
                    foodGrid.appendChild(item);
                });
            }
            
            isLoading = false;
        })
        .catch(error => {
            console.error('Ошибка загрузки:', error);
            isLoading = false;
        });
}

function setupFilters() {
    // Только сортировка
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const url = new URL(window.location);
            url.searchParams.set('sort', this.value);
            window.location.href = url.toString();
        });
    }
}

// Функция добавления в корзину
function addToCart(foodId) {
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    fetch('/cart/api/add/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({
            food_id: foodId,
            quantity: 1
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Товар добавлен в корзину!', 'success');
            updateCartCount();
        } else {
            showNotification(data.message || 'Ошибка добавления', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showNotification('Ошибка сети', 'error');
    });
}

function showNotification(message, type = 'success') {
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `food-notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    
    // Стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ecc71' : '#e74c3c'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        animation: slideIn 0.3s ease forwards;
    `;
    
    // Добавляем анимации
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

function updateCartCount() {
    fetch('/cart/api/data/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const cartCount = document.getElementById('cartCount');
                if (cartCount) {
                    cartCount.textContent = data.total_items;
                }
            }
        });
}